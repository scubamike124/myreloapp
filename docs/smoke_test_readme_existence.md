# Smoke Test: Confirm README.md Exists at Repo Root

This document outlines the smoke test procedure to verify the existence of the `README.md` file at the root of the repository. This is a crucial step to ensure that essential documentation is available for users and contributors.

## Purpose
The purpose of this smoke test is to confirm that the `README.md` file is present in the repository. The `README.md` file typically contains vital information about the project, including installation instructions, usage guidelines, and contribution details.

## Procedure
1. Open your terminal.
2. Navigate to the root directory of the repository using the command:
   ```bash
   cd /path/to/repo
   ```
3. List the files in the directory using the command:
   ```bash
   ls -la
   ```
4. Check for the presence of `README.md` in the output.

## Expected Output
The output of the `ls -la` command should include `README.md` in the list of files.

## Screenshots
- **Desktop Output:**
  ![Desktop Output](path/to/desktop_screenshot.png)

- **Mobile Output:**
  ![Mobile Output](path/to/mobile_screenshot.png)

## Conclusion
If the `README.md` file is present, the smoke test is successful. If it is missing, further investigation is required to ensure that documentation is properly maintained.