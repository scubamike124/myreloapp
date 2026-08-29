# Smoke Test for README.md Existence

This document outlines the steps to confirm the existence of the `README.md` file at the root of the repository, along with the required evidence for verification.

## Steps to Confirm README.md Existence
1. **Check for File Existence**: Navigate to the root directory of the repository and verify that the `README.md` file is present.
2. **Gather Evidence**:
   - **File Size**: Use the command `ls -lh README.md` to obtain the file size.
   - **First Line Content**: Use the command `head -n 1 README.md` to retrieve the first line of the file.

## Example Commands
```bash
ls -lh README.md
head -n 1 README.md
```

## Evidence Required
- **File Size**: Document the size of the `README.md` file.
- **First Line Content**: Document the content of the first line of the `README.md` file.

## Screenshots Required
- Capture screenshots of the terminal output for both the file size and first line content checks on both desktop and mobile views.

## Next Steps
- After gathering the required evidence, re-run the project test suite to ensure all tests pass.