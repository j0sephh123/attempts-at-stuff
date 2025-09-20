# Company API

A simple Express.js API application with CRUD functionality for companies.

## Company Model

- `id`: Random UUID identifier
- `name`: String
- `createdAt`: Date
- `updatedAt`: Date

## API Endpoints

- `GET /` - Hello world
- `GET /companies` - Get all companies
- `GET /companies/:id` - Get company by ID
- `POST /companies` - Create new company (requires `name` in body)
- `PUT /companies/:id` - Update company (requires `name` in body)
- `DELETE /companies/:id` - Delete company

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Usage

The API runs on port 3004 by default. Visit `http://localhost:3004` to see the hello world response.

## Docker

Build the Docker image:

```bash
docker build -t company-api .
```

Run the container:

```bash
docker run -p 3004:3004 company-api
```
