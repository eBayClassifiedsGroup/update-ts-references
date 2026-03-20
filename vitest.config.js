module.exports = {
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.js'],
        exclude: ['test-run/**', 'test-scenarios/**'],
    },
};
