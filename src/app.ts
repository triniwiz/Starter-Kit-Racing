import { createApp, registerElement } from "nativescript-vue";
import "@nativescript/canvas-polyfill";
import Home from "./components/Home.vue";
import { Canvas } from "@nativescript/canvas";
import { Application, Color, Label } from "@nativescript/core";
Application.on(Application.uncaughtErrorEvent, (args) => {
    console.error("Uncaught error:", args.error);
});
registerElement("Canvas", () => Canvas);
createApp(Home).start();
