const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "company-api.log" }),
  ],
});

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "data.json");

function readCompanies() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      writeCompanies([]);
      return [];
    }

    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logger.error("Error reading companies:", error);
    return [];
  }
}

function writeCompanies(companies) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(companies, null, 2));
    logger.info(
      `Companies data written to file. Total companies: ${companies.length}`
    );
  } catch (error) {
    logger.error("Error writing companies:", error);
    throw error;
  }
}

function createCompany(name) {
  const companies = readCompanies();
  const company = {
    id: uuidv4(),
    name: name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  companies.push(company);
  writeCompanies(companies);
  logger.info(`Company created: ${company.id} - ${company.name}`);
  return company;
}

function getAllCompanies() {
  const companies = readCompanies();
  logger.info(`Retrieved ${companies.length} companies`);
  return companies;
}

function getCompanyById(id) {
  const companies = readCompanies();
  const company = companies.find((c) => c.id === id);
  if (company) {
    logger.info(`Company retrieved: ${company.id} - ${company.name}`);
  } else {
    logger.warn(`Company not found: ${id}`);
  }
  return company;
}

function updateCompany(id, name) {
  const companies = readCompanies();
  const companyIndex = companies.findIndex((c) => c.id === id);

  if (companyIndex === -1) {
    logger.warn(`Company not found for update: ${id}`);
    return null;
  }

  companies[companyIndex].name = name;
  companies[companyIndex].updatedAt = new Date().toISOString();

  writeCompanies(companies);
  logger.info(`Company updated: ${id} - ${name}`);
  return companies[companyIndex];
}

function deleteCompany(id) {
  const companies = readCompanies();
  const companyIndex = companies.findIndex((c) => c.id === id);

  if (companyIndex === -1) {
    logger.warn(`Company not found for deletion: ${id}`);
    return false;
  }

  const deletedCompany = companies.splice(companyIndex, 1)[0];
  writeCompanies(companies);
  logger.info(`Company deleted: ${id} - ${deletedCompany.name}`);
  return true;
}

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  logger,
};
