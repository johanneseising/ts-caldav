# CalDAV Client for Node.js

A lightweight and robust CalDAV client for Node.js applications, written in TypeScript. This library enables seamless integration with CalDAV servers to manage calendars, events, and tasks.

## Features

- 🗓️ Authenticate and interact with CalDAV servers.
- ⚡ Simple and intuitive API.
- 🔒 Built-in credential validation.
- 🛠️ Fully written in TypeScript.

## Contributing

We welcome contributions! Follow the steps below to get started:

1. Fork the repository.
2. Clone your fork:

   ```bash
   git clone https://github.com/your-username/caldav-client.git
   cd caldav-client
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Add the environment variable needed for testing

    ```env
    CALDAV_BASE_URL=
    CALDAV_USERNAME=
    CALDAV_PASSWORD=
    ```

5. Create a new branch for your feature:

   ```bash
   git checkout -b feature-name
   ```

6. Make your changes and run tests:

   ```bash
   pnpm test
   ```

7. Lint your code:

   ```bash
   pnpm run lint
   ```

8. Commit and push your changes:

   ```bash
   git add .
   git commit -m "Add feature-name"
   git push origin feature-name
   ```

9.  Open a pull request.

### Code Style

This project uses [ESLint](https://eslint.org/) for consistent code style. Run `pnpm run lint` to check for linting errors.

## Roadmap

- [x] Authenticate with CalDAV servers.
- [x] Validate credentials during initialization.
- [x] Add support for listing calendars.
- [ ] Implement event creation and management.
- [ ] Enhance error handling and debugging tools.
- [ ] Support task (VTODO) management.
- [ ] Improve documentation with examples.
- [ ] Implement Syncing via Change Tags
- [ ] Test react-native usage.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
