# Nyaya Mitra - Legal Assistance Platform

Nyaya Mitra is a comprehensive legal assistance platform designed to empower citizens with accessible legal services through advanced technology and innovation. This project is developed as a mini-project for BCA at Christ University.

## Project Overview

Nyaya Mitra provides multiple services to assist citizens with legal matters:

- **Document Analyzer**: AI-powered legal document analysis
- **SOS Alerts**: Emergency legal assistance with location sharing
- **Whistleblower Portal**: Secure reporting of corruption
- **Civic Feedback**: Platform for submitting civic issues
- **Case Tracker**: Track ongoing legal cases
- **Legal Chatbot**: AI assistant for legal queries (NyayaBot)

## Developers

- **Sachin Yadav**: Lead Developer & Project Manager
- **Surya Vamshi S**: UI/UX Designer & Frontend Developer  
- **Hema C**: Legal Research Specialist & Content Manager

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: SQLite with better-sqlite3
- **Real-time Communication**: Socket.io
- **Authentication**: JWT, bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **AI Integration**: Document analysis, chatbot functionality

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/nyaya-mitra.git
   cd nyaya-mitra
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Initialize the database:
   ```
   npm run init-db
   ```

4. Start the server:
   ```
   npm start
   ```

5. Access the website:
   Open your browser and navigate to `http://localhost:3000`

### Development Mode

To run the server in development mode with auto-reload:
```
npm run dev
```

## Features

### Document Analyzer
- Upload legal documents for automatic analysis
- Extract key information from FIRs, contracts, court orders, etc.
- Get structured data and insights from unstructured legal text

### SOS Alerts
- Send emergency alerts with location information
- Connect with nearby legal professionals
- Store emergency contacts for quick assistance

### Whistleblower Portal
- Securely and anonymously report corruption
- End-to-end encryption for user protection
- Track report status with anonymous ID

### NyayaBot
- AI-powered legal assistant
- Answer common legal questions
- Guide users through legal procedures

## Project Structure

```
nyaya-mitra/
├── components/       # Reusable UI components
├── data/            # Database files
├── database/        # Database initialization and schema
├── js/             # JavaScript modules
├── middleware/     # Express middleware
├── routes/         # API routes
├── *.html          # HTML pages
├── *.css           # CSS styles
├── *.js            # JavaScript files
├── server.js       # Main server file
└── package.json    # Project dependencies
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Christ University for providing the platform and guidance
- All contributors who have helped with research and development
- Open-source community for the tools and libraries used in this project