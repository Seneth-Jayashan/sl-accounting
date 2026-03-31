export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      
      const zodErrors = result.error.errors || [];

      const formattedErrors = zodErrors.map((e) => {
        const fieldPath = e.path.length > 1 ? e.path.slice(1).join(".") : e.path.join(".");
        
        return {
          field: fieldPath,
          message: e.message,
        };
      });


      return res.status(400).json({
        success: false,
        message: formattedErrors.length > 0 ? formattedErrors[0].message : "Validation Error",
        errors: formattedErrors,
      });
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();

  } catch (err) {
    console.error("Validator System Error:", err);
    return res.status(500).json({ success: false, message: "Internal Validator Error" });
  }
};