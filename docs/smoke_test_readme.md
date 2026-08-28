# Smoke Test: Verify README.md Existence

This document outlines the steps to confirm the existence of the `README.md` file at the root of the repository, including detailed evidence of its size and content.

## Steps to Verify README.md
1. **Navigate to the Repository Root**: Open your terminal or command prompt and change the directory to the root of your repository.
   ```bash
   cd /path/to/your/repo
   ```

2. **Check for README.md File**: Use the following command to check if the `README.md` file exists:
   ```bash
   ls -l README.md
   ```
   - This command will list the file details, including its size and permissions.

3. **Verify File Size**: Ensure that the output shows the file size. For example:
   ```
   -rw-r--r-- 1 user group 2048 Oct 10 12:00 README.md
   ```
   - In this example, the file size is 2048 bytes.

4. **Check First Line Content**: To view the first line of the `README.md`, use:
   ```bash
   head -n 1 README.md
   ```
   - This will display the first line of the file, confirming its content.

5. **Document Findings**: Record the file size and the first line content as evidence of the README.md file's existence.

## Example Evidence
- **File Size**: 2048 bytes
- **First Line Content**: `# Project Title`

## Next Steps
- After completing the verification, re-run the project test suite to ensure everything is functioning correctly.
- Capture screenshots of the terminal output for both desktop and mobile views as required.