# My Project

This project is a comprehensive application that consists of both frontend and backend components. It is designed to provide a robust environment for managing agents and executing tasks efficiently.

## Project Structure

The project is organized into the following main directories:

- **Frontend**: Contains the client-side application built with React and TypeScript.
  - **src**: The source code for the frontend application, including components, hooks, services, and styles.
  - **public**: Static files such as `index.html` and assets.
  - **configuration files**: Includes files like `package.json`, `vite.config.ts`, and others for managing dependencies and build settings.

- **backend-node**: Contains the Node.js backend application.
  - **src**: The source code for the backend server, including the main server file.
  - **configuration files**: Includes files like `package.json` and `.gitignore` for managing dependencies and ignored files.

- **backend-python**: Contains the Python backend application.
  - **src**: The source code for the Python backend, including the main application logic and orchestration.
  - **configuration files**: Includes files like `requirements.txt` and `Dockerfile` for managing dependencies and containerization.

## Features

- **Frontend**:
  - A responsive user interface built with React.
  - Various components for managing agents, executing tasks, and displaying results.
  - Integration with backend services for data management.

- **Backend**:
  - A Node.js server for handling API requests and managing agent interactions.
  - A Python backend for executing complex tasks and managing agent logic.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the frontend directory and install dependencies:
   ```
   cd Frontend
   npm install
   ```

3. Navigate to the backend-node directory and install dependencies:
   ```
   cd ../backend-node
   npm install
   ```

4. Navigate to the backend-python directory and install dependencies:
   ```
   cd ../backend-python
   pip install -r requirements.txt
   ```

5. Start the servers:
   - For the Node.js backend:
     ```
     cd ../backend-node/src
     node server.js
     ```
   - For the Python backend:
     ```
     cd ../backend-python
     python main.py
     ```

6. Start the frontend application:
   ```
   cd ../Frontend
   npm start
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.