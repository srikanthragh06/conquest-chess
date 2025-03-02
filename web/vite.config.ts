import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// @ts-ignore
// import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 5173, // Optional: set a custom port if needed
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
