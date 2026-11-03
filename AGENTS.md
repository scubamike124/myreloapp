<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reuse first, build last

This rule is permanent. It applies to every contributor, human or agent, before building a feature or fixing a problem.

1. Reuse what this project already has: its existing modules, helpers, API routes and components.
2. Reuse services and APIs that are already connected.
3. Otherwise, use free, secure, maintained open-source packages with licences that allow commercial use.
4. Integrate the best existing option.
5. Only then custom-build the missing part.

Do not duplicate an existing system. Do not add paid services, accounts or spending without the owner's approval. Reusing something never skips verification: keep the security, compatibility and acceptance tests. In a pull request, say what existing code you reused, or why nothing fit.
