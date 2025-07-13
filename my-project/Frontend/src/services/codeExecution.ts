import { exec } from 'child_process';

export const executeCode = (code: string, language: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Define the command based on the language
        let command: string;

        switch (language) {
            case 'javascript':
                command = `node -e "${code}"`;
                break;
            case 'python':
                command = `python -c "${code}"`;
                break;
            // Add more languages as needed
            default:
                return reject(new Error('Unsupported language'));
        }

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error: ${stderr}`);
            }
            resolve(stdout);
        });
    });
};