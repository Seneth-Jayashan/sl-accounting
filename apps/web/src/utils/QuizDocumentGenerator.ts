import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import html2pdf from "html2pdf.js";
import { type Quiz } from "../services/QuizService";

// Helper to strip HTML tags for docx
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export const QuizDocumentGenerator = {
  // ==========================================
  // 1. GENERATE PDF
  // ==========================================
  generateQuizPdf: async (quiz: Quiz) => {
    // 1. Create a hidden container
    const container = document.createElement("div");
    container.style.padding = "40px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.color = "#000";
    container.style.width = "800px";

    // 2. Build HTML Content
    let html = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px;">${quiz.title}</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">
          Duration: ${quiz.duration} mins | Total Points: ${quiz.totalPoints} | Pass Mark: ${quiz.passingPercentage}%
        </p>
      </div>
      
      <div style="margin-bottom: 40px; display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
        <div style="flex: 1;">Student Name: _______________________</div>
        <div style="flex: 1;">Student ID: _______________________</div>
        <div style="flex: 1;">Date: _______________________</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>Instructions:</strong> Answer all questions. For multiple choice, select the best answer.
      </div>
    `;

    quiz.questions.forEach((q, index) => {
      html += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <strong>${index + 1}.</strong>
            <div>
              <div style="margin: 0;">${q.questionText}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">[${q.points} Points]</div>
            </div>
          </div>
      `;

      if (q.questionType === "mcq" || q.questionType === "multi-select" || q.questionType === "true-false") {
        html += `<div style="margin-left: 25px;">`;
        q.options.forEach((opt, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex);
          html += `
            <div style="margin-bottom: 8px;">
              ( &nbsp;&nbsp; ) &nbsp; <strong>${letter}.</strong> ${stripHtml(opt.optionText)}
            </div>
          `;
        });
        html += `</div>`;
      } else if (q.questionType === "short-answer") {
        html += `
          <div style="margin-left: 25px; margin-top: 20px;">
            __________________________________________________________________<br><br>
            __________________________________________________________________<br><br>
            __________________________________________________________________
          </div>
        `;
      }

      html += `</div>`;
    });

    container.innerHTML = html;

    // 3. Generate PDF
    html2pdf().set({
      margin: 10,
      filename: `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_paper.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save();
  },

  // ==========================================
  // 2. GENERATE WORD DOCX
  // ==========================================
  generateQuizDocx: async (quiz: Quiz) => {
    const children: any[] = [];

    // Header
    children.push(
      new Paragraph({
        text: quiz.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );

    children.push(
      new Paragraph({
        text: `Duration: ${quiz.duration} mins | Total Points: ${quiz.totalPoints} | Pass Mark: ${quiz.passingPercentage}%`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun("Student Name: _______________________      Student ID: _______________________      Date: _______________________"),
        ],
        spacing: { after: 400 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Instructions:", bold: true }),
          new TextRun(" Answer all questions. For multiple choice, select the best answer."),
        ],
        spacing: { after: 400 },
      })
    );

    // Questions
    quiz.questions.forEach((q, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun(stripHtml(q.questionText)),
          ],
          spacing: { before: 400, after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${q.points} Points]`, italics: true, color: "666666" }),
          ],
          spacing: { after: 200 },
        })
      );

      if (q.questionType === "mcq" || q.questionType === "multi-select" || q.questionType === "true-false") {
        q.options.forEach((opt, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex);
          children.push(
            new Paragraph({
              text: `(    )   ${letter}. ${stripHtml(opt.optionText)}`,
              indent: { left: 720 },
              spacing: { after: 100 },
            })
          );
        });
      } else if (q.questionType === "short-answer") {
        for (let i = 0; i < 3; i++) {
          children.push(
            new Paragraph({
              text: "____________________________________________________________________________________",
              indent: { left: 720 },
              spacing: { after: 200, before: 100 },
            })
          );
        }
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_paper.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
