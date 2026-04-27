import { createApp, registerElement } from "nativescript-vue";
import "@nativescript/canvas-polyfill";
import Home from "./components/Home.vue";
import { Canvas } from "@nativescript/canvas";
import { Color, Label } from "@nativescript/core";
registerElement("Canvas", () => Canvas);
createApp(Home).start();
