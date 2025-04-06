# User and Document Management System

A comprehensive NestJS application for managing users and documents with AI-powered document analysis capabilities.

## Features

- **User Management**: Create, update, and manage user accounts with role-based access control
- **Authentication**: Secure JWT-based authentication system
- **Document Management**: Upload, store, and manage various document types (PDF, DOCX, XLSX)
- **AI-Powered Analysis**: Integrate with external AI services to analyze document content
- **API-First Design**: RESTful API endpoints for all functionality
- **Robust Logging**: Comprehensive logging system for monitoring and debugging

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT
- **Validation**: Class-validator and Joi
- **Logging**: Winston with daily rotation
- **File Handling**: Multer
- **HTTP Client**: Axios

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- External AI service endpoint (for document analysis)

## Installation

1. Clone the repository:
   ```bash
   git clone https://gitlab.com/pankajaroraymca/user_and_doc_mng.git
   cd user_and_doc_mng
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create environment files in the `env` directory based on your deployment environment:
   - `.env.local` - for local development
   - `.env.dev` - for development environment
   - `.env.uat` - for user acceptance testing
   - `.env.prod` - for production

   Each file should include the following variables:
   ```
   NODE_ENV=local|dev|uat|prod
   PORT=3000
   
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USERNAME=postgres
   POSTGRES_DATABASE=user_doc_db
   POSTGRES_PASSWORD=your_password
   POSTGRES_SCHEMA=public
   POSTGRES_SYNC=true
   POSTGRES_SSL=false
   
   JWT_SECRET=your_jwt_secret
   
   ALLOW_ORIGIN=http://localhost:3000,http://localhost:4200
   
   DS_BASE_URL=http://your-ai-service-endpoint
   ```

## Running the Application

### Development
```bash
npm run start:watch   # For local development with hot reload
npm run start:dev     # For development environment with hot reload
```

### Production
```bash
npm run build
npm run start
```

## API Endpoints

The API is versioned and all endpoints are prefixed with `/v1/api`.

### Authentication
- `POST /v1/api/auth/login` - User login
- `POST /v1/api/auth/register` - User registration

### User Management
- `GET /v1/api/user` - Get all users (admin only)
- `GET /v1/api/user/:id` - Get user by ID
- `POST /v1/api/user` - Create a new user
- `PATCH /v1/api/user/:id` - Update a user
- `DELETE /v1/api/user/:id` - Delete a user
- `PATCH /v1/api/user/change-password/:id` - Change password for a user
- `PATCH /v1/api/user/change-role/:id` - Change role for a user
- `POST /v1/api/user/bulk-register-users` - Bulk Register users
- `POST /v1/api/user/bulk-delete-users` - Bulk Delete Users.

### Document Management
- `POST /v1/api/doc/upload` - Upload a document
- `GET /v1/api/doc` - Get all documents
- `GET /v1/api/doc/:id` - Get document by ID
- `DELETE /v1/api/doc/:id` - Delete a document

### GenAI Analysis
- `POST /v1/api/genai/process` - Process a document with AI
- `POST /v1/api/genai/webhook` - ingest the result from genai
- `GET /v1/api/genai/response/:requestId` - Get AI analysis results

## User Roles

The system supports three user roles:
- **ADMIN**: Full access to all features
- **EDITOR**: Can upload and manage documents and run AI analysis
- **VIEWER**: Can only view documents and analysis results

## Project Structure

```
user_and_doc_mng/
├── src/
│   ├── common/            # Common utilities, guards, interceptors
│   │   ├── config/        # Environment configuration
│   │   ├── constants/     # Application constants
│   │   ├── decorators/    # Custom decorators
│   │   ├── dto/           # Data transfer objects
│   │   ├── entities/      # Base entities
│   │   ├── enums/         # Enumerations
│   │   ├── guards/        # Authentication guards
│   │   ├── interceptors/  # Request/response interceptors
│   │   ├── modules/       # Common modules (database)
│   │   ├── services/      # Common services
│   │   └── utility/       # Utility functions
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication module
│   │   ├── doc/           # Document management module
│   │   ├── genAI/         # AI analysis module
│   │   └── user/          # User management module
│   ├── app.controller.ts  # Main app controller
│   ├── app.module.ts      # Main app module
│   ├── app.service.ts     # Main app service
│   └── main.ts            # Application entry point
├── test/                  # End-to-end tests
├── env/                   # Environment configuration files
└── files/                 # Uploaded files storage
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [UNLICENSED] License.
