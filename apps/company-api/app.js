const express = require("express");
const app = express();
const PORT = process.env.PORT || 3004;
const companyService = require("./companyService");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/companies", (req, res) => {
  try {
    const companies = companyService.getAllCompanies();
    res.json(companies);
  } catch (error) {
    companyService.logger.error("Error getting companies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/companies/:id", (req, res) => {
  try {
    const company = companyService.getCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    companyService.logger.error("Error getting company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/companies", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const company = companyService.createCompany(name);
    res.status(201).json(company);
  } catch (error) {
    companyService.logger.error("Error creating company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/companies/:id", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const company = companyService.updateCompany(req.params.id, name);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    companyService.logger.error("Error updating company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/companies/:id", (req, res) => {
  try {
    const deleted = companyService.deleteCompany(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Company not found" });
    }
    res.status(204).send();
  } catch (error) {
    companyService.logger.error("Error deleting company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  companyService.logger.info(`Server is running on port ${PORT}`);
});
