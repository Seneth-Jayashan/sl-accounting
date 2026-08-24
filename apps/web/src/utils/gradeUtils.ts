export const getGradeDetails = (percentage: number) => {
  if (percentage >= 75) {
    return { 
      grade: 'A', 
      label: 'Excellent', 
      quote: "Outstanding! Keep up the brilliant work.", 
      color: "text-green-600", 
      bg: "bg-green-50", 
      border: "border-green-200" 
    };
  } else if (percentage >= 65) {
    return { 
      grade: 'B', 
      label: 'Very Good', 
      quote: "Great effort! You're very close to excellence.", 
      color: "text-emerald-600", 
      bg: "bg-emerald-50", 
      border: "border-emerald-200" 
    };
  } else if (percentage >= 50) {
    return { 
      grade: 'C', 
      label: 'Good', 
      quote: "Good job! Keep pushing to reach the next level.", 
      color: "text-blue-600", 
      bg: "bg-blue-50", 
      border: "border-blue-200" 
    };
  } else if (percentage >= 35) {
    return { 
      grade: 'S', 
      label: 'Pass', 
      quote: "You made it! Now aim higher next time.", 
      color: "text-orange-500", 
      bg: "bg-orange-50", 
      border: "border-orange-200" 
    };
  } else {
    return { 
      grade: 'F', 
      label: 'Fail', 
      quote: "Don't give up—this is your starting point for success.", 
      color: "text-red-600", 
      bg: "bg-red-50", 
      border: "border-red-200" 
    };
  }
};
