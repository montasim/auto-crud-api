# Dynamic Mongoose CRUD API with Zod Validation and Dummy Data Generation

<!-- repository summary badges start -->
<div>
    <img alt="Wakatime coding time badge" src="https://wakatime.com/badge/user/bb224c90-7cb7-4c45-953e-a9e26c1cb06c/project/80c8cc35-4f13-44d4-af93-059830f95de8.svg?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub repo file count" src="https://img.shields.io/github/directory-file-count/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
    <img alt="GitHub license" src="https://img.shields.io/github/license/montasim/auto-crud-api?labelColor=EB008B&color=00B8B5">
</div>
<!-- repository summary badges end -->

This project is a dynamic CRUD API built with [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/), [Zod](https://github.com/colinhacks/zod), and [Faker](https://github.com/faker-js/faker). It dynamically creates Mongoose models, Zod schemas, and Express routes based on predefined schema definitions for entities such as **users**, **products**, and **orders**. In addition, it supports dummy data generation for testing purposes.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
    - [Running the Server](#running-the-server)
    - [API Endpoints](#api-endpoints)
    - [Generating Dummy Data](#generating-dummy-data)
- [Project Structure](#project-structure)
- [Customization](#customization)
- [License](#license)

---

## Features

- **Dynamic Model & Schema Generation**  
  Define your data models in one place and automatically generate:

    - Mongoose models with built-in validation rules.
    - Zod schemas for runtime request validation.
    - Express CRUD routes (Create, Read, Update, Delete).

- **Comprehensive Validation**  
  Uses Zod to validate incoming requests, ensuring:

    - Required fields are provided.
    - Fields match defined regex patterns.
    - Numeric and string length constraints are met.
    - MongoDB ObjectId validation for reference fields.

- **Dummy Data Generation**  
  Generate sample/dummy records using Faker and RandExp:

    - Automatically create valid dummy values for strings, numbers, booleans, dates, and ObjectIds.
    - Useful for testing or seeding your database.

- **Flexible Routing**  
  Routes are dynamically registered with multiple URL patterns for common operations:

    - Create (e.g., `/`, `/create`, `/new`)
    - Read (e.g., `/`, `/all`, `/list`, `/read`, `/show`, `/view`)
    - Update (e.g., `/:id`, `/edit/:id`, `/update/:id`)
    - Delete (e.g., `/:id`, `/delete/:id`, `/destroy/:id`, and bulk delete endpoints)

- **Additional Features**
    - Uniqueness checks for fields.
    - Dynamic reference population in query responses.
    - Detailed logging and error handling.

---

## Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

    or if you use Yarn:

    ```bash
    yarn install
    ```

3. **Configure Environment Variables:**

    Create a `.env` file in the root directory and add your MongoDB connection string and any other necessary configuration (if applicable). For example:

    ```env
    MONGODB_URI=mongodb://localhost:27017/your-db-name
    PORT=3000
    ```

---

## Usage

### Running the Server

Start the server using:

```bash
npm start
```

or with Yarn:

```bash
yarn start
```

The server will run on the port specified in your environment variables (default is `3000`).

### API Endpoints

Since the routes are dynamically created based on the schema definitions, you can access the endpoints under `/api/<modelName>`. For example:

#### Users

- **Create a new user:** `POST /api/users`
- **Get all users:** `GET /api/users`
- **Get a single user:** `GET /api/users/:id`
- **Update a user:** `PATCH /api/users/:id`
- **Delete a user:** `DELETE /api/users/:id`

#### Products

- **Create a new product:** `POST /api/products`
- **Get all products:** `GET /api/products`
- **Get a single product:** `GET /api/products/:id`
- **Update a product:** `PATCH /api/products/:id`
- **Delete a product:** `DELETE /api/products/:id`

#### Orders

- **Create a new order:** `POST /api/orders`
- **Get all orders:** `GET /api/orders`
- **Get a single order:** `GET /api/orders/:id`
- **Update an order:** `PATCH /api/orders/:id`
- **Delete an order:** `DELETE /api/orders/:id`

Each endpoint also supports multiple path variations (e.g., `/create`, `/new`, `/list`, `/read`, etc.) to provide flexible routing options.

### Generating Dummy Data

To quickly generate dummy records for any model, use one of the dummy data creation endpoints. For example, to generate dummy users:

```http
POST /api/users/create/dummy?count=5
```

**Query Parameters:**

- `count` (optional): Number of dummy records to generate (default is `1`).

Dummy data generation leverages Faker and RandExp to create valid records that comply with your schema validations.

---

## Project Structure

```plaintext
.
├── src
│   ├── constants
│   │   └── constants.js          # Contains regex and other constant values.
│   ├── models                    # (Optional) Custom models if needed.
│   ├── routes                    # Dynamic CRUD routes are generated here.
│   └── schema                    # Schema definitions and dynamic creation logic.
│       ├── createMongooseModel.js# Helper to create Mongoose models.
│       └── createZodSchemas.js   # Helper to create Zod validation schemas.
├── lib
│   ├── logger.js                 # Logging utility.
│   ├── schema.js                 # Additional schema utilities.
│   └── ...                       # Other library utilities.
├── utils
│   ├── asyncHandler.js           # Async route handler wrapper.
│   ├── validateInput.js               # Zod validation middleware.
│   ├── toSentenceCase.js         # Utility to convert strings to sentence case.
│   └── getIntValue.js            # Utility for parsing integer values.
├── index.js                      # Entry point for the Express application.
├── package.json
└── README.md
```

---

## Customization

### Extending Schemas:

Modify the `routes.config.mjs` file to add or adjust fields and validations for your models and routes.

### Validation Rules:

Customize the regex patterns, min/max lengths, and other validation constraints as per your requirements.

### Routes and Middleware:

The dynamic CRUD routes can be extended or customized by modifying the route creation logic in the CRUD route file.

### Logging and Error Handling:

Adjust the logging messages and error response formats in `logger.js` and the shared response utilities.

---

## License

[![by-nc-nd/4.0](https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This project is licensed under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**.

### You are free to:

- **Share** — Copy and redistribute the material in any medium or format.

### Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **NoDerivatives** — If you remix, transform, or build upon the material, you may not distribute the modified material.

For more details, please visit the [Creative Commons License Page](https://creativecommons.org/licenses/by-nc-nd/4.0/).

---

## Feel Free to Contact Me

<!-- social media links start -->
<table>
    <thead align="center">
        <tr>
            <th>
                <a href="https://www.linkedin.com/in/montasim">
                    <img alt="Linkedin icon" src="https://cdn.simpleicons.org/linkedin" width="35px">
                </a>
            </th>
            <th>
                <a href="https://www.github.com/montasim">
                    <img alt="GitHub icon" src="https://cdn.simpleicons.org/github/white" width="35px">
                </a>
            </th>
            <th>
                <a href="https://stackoverflow.com/users/20348607/montasim">
                    <img alt="StackOverflow icon" src="https://cdn.simpleicons.org/stackoverflow" width="35px">
                </a>
            </th>
            <th>
                <a href="https://montasim-dev.web.app/">
                    <img alt="web icon" src="https://cdn.simpleicons.org/googlechrome" width="35px">
                </a>
            </th>
            <th>
                <a href="mailto:montasimmamun@gmail.com">
                    <img alt="Gmail icon" src="https://cdn.simpleicons.org/gmail" width="35px">
                </a>
            </th>
            <th>
                <a href="https://www.facebook.com/montasimmamun/">
                    <img alt="Facebook icon" src="https://cdn.simpleicons.org/facebook" width="35px">
                </a>
            </th>
            <th>
                <a href="https://x.com/montasimmamun">
                    <img alt="X icon" src="https://cdn.simpleicons.org/x" width="35px">
                </a>
            </th>
        </tr>
    </thead>
</table>
<!-- social media links end -->
<!-- connect with me end -->

<br/>
<br/>
<br/>
