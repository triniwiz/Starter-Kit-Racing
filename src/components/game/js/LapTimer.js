import * as THREE from "three";
import {
  StackLayout,
  Label,
  ApplicationSettings,
  Color,
} from "@nativescript/core";

import {
  CELL_RAW,
  GRID_SCALE,
  TRACK_CELLS,
  TYPE_NAMES,
  computeSpawnPosition,
} from "./Track.js";

const FINISH = TYPE_NAMES[3];
const STORAGE_PREFIX = "racing.bestLap.";
const _tmp = new THREE.Vector3();

function loadBest(key) {
  try {
    if (ApplicationSettings.hasKey(key)) {
      return Number(ApplicationSettings.getString(key));
    }
  } catch {}
  return null;
}

function saveBest(key, value) {
  try {
    ApplicationSettings.setString(key, String(value));
  } catch {}
}

function formatTime(t) {
  if (t === null || t === undefined) return "0:00.00";
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

function createColorAnimation(label, color, duration, onEnd) {
  if (__ANDROID__) {
    const colors = Array.create("java.lang.Integer", 2);
    colors[0] = java.lang.Integer.valueOf(
      label.nativeTextViewProtected.getCurrentTextColor(),
    );
    colors[1] = java.lang.Integer.valueOf(color.android);
    const anim = android.animation.ValueAnimator.ofObject(
      new android.animation.ArgbEvaluator(),
      colors,
    );
    anim.setDuration(duration);
    anim.addUpdateListener(
      new android.animation.ValueAnimator.AnimatorUpdateListener({
        onAnimationUpdate(animation) {
          const value = animation.getAnimatedValue();
          label.nativeTextViewProtected.setTextColor(
            android.graphics.Color.argb(color.a, color.r, color.g, color.b),
          );
        },
      }),
    );
    if (onEnd) {
      anim.addListener(
        new android.animation.Animator.AnimatorListener({
          onAnimationEnd(param0, param1) {
            if (onEnd) {
              onEnd();
            }
          },
          onAnimationStart(param0, param1) {},
          onAnimationCancel(param0) {},
          onAnimationRepeat(param0) {},
        }),
      );
    }

    anim.start();
  }

  if (__APPLE__) {
    if (onEnd) {
      UIView.animateWithDurationAnimationsCompletion(
        duration / 1000,
        () => {
          label.nativeView.textColor = color.ios;
        },
        (done) => {
          if (onEnd && done) {
            onEnd();
          }
        },
      );
    } else {
      UIView.animateWithDurationAnimations(duration / 1000, () => {
        label.nativeView.textColor = color.ios;
      });
    }
  }
}

export class LapTimer {
  constructor(canvas, cells, trackId) {
    this.page = canvas.page;

    this.storageKey = STORAGE_PREFIX + (trackId || "default");
    this.lap = 1;
    this.bestLap = loadBest(this.storageKey);
    this.lastLap = null;
    this.currentLapTime = 0;
    this.running = false;

    this.lineCenter = new THREE.Vector3();
    this.lineForward = new THREE.Vector3(0, 0, 1);
    this.lineRight = new THREE.Vector3(1, 0, 0);

    this.prevForwardProj = null;

    this.cellSize = CELL_RAW * GRID_SCALE;
    this.requiredCells = new Set();
    this.visitedCells = new Set();

    const list = cells || TRACK_CELLS;
    this.enabled = list.some((c) => c[2] === FINISH);

    if (this.enabled) {
      const spawn = computeSpawnPosition(list);

      this.lineCenter.set(spawn.position[0], 0, spawn.position[2]);
      this.lineForward.set(Math.sin(spawn.angle), 0, Math.cos(spawn.angle));
      this.lineRight.set(this.lineForward.z, 0, -this.lineForward.x);

      for (const c of list) {
        if (c[2] !== FINISH) {
          this.requiredCells.add(c[0] + "," + c[1]);
        }
      }

      this.buildUI();
    }
  }

  buildUI() {
    const container = new StackLayout();
    container.padding = 12;
    container.color = "#ffffff";
    container.backgroundColor = "rgba(0,0,0,0.5)";
    container.borderRadius = 10;
    container.opacity = 0.95;

    container.horizontalAlignment = "left";
    container.verticalAlignment = "top";
    container.marginTop = 60;
    container.marginLeft = 12;

    const lapRow = new StackLayout();
    lapRow.orientation = "horizontal";

    const lapLabel = new Label();
    lapLabel.text = "LAP ";
    lapLabel.opacity = 0.7;

    this.lapEl = new Label();
    this.lapEl.text = "1";

    lapRow.addChild(lapLabel);
    lapRow.addChild(this.lapEl);

    this.currentEl = new Label();
    this.currentEl.color = new Color("#ffffff");
    this.currentEl.text = formatTime(null);
    this.currentEl.fontSize = 24;
    this.currentEl.marginTop = 4;
    this.currentEl.marginBottom = 6;

    setTimeout(() => {
      createColorAnimation(this.currentEl, new Color("#5af168"), 500, () => {
        createColorAnimation(this.currentEl, new Color("#ffffff"), 500);
      });
    }, 3000);

    const lastRow = new StackLayout();
    lastRow.orientation = "horizontal";

    const lastLabel = new Label();
    lastLabel.text = "LAST ";
    lastLabel.opacity = 0.7;

    this.lastEl = new Label();
    this.lastEl.text = formatTime(null);

    lastRow.addChild(lastLabel);
    lastRow.addChild(this.lastEl);

    const bestRow = new StackLayout();
    bestRow.orientation = "horizontal";

    const bestLabel = new Label();
    bestLabel.text = "BEST ";
    bestLabel.opacity = 0.7;

    this.bestEl = new Label();
    this.bestEl.text = formatTime(this.bestLap);

    bestRow.addChild(bestLabel);
    bestRow.addChild(this.bestEl);

    container.addChild(lapRow);
    container.addChild(this.currentEl);
    container.addChild(lastRow);
    container.addChild(bestRow);

    this.page.content.addChild(container);
  }

  update(dt, position, hasInput) {
    if (!this.enabled) return;
    if (!this.running && !hasInput) return;

    this.running = true;

    this.currentLapTime += dt;
    this.currentEl.text = formatTime(this.currentLapTime);

    const gx = Math.floor(position.x / this.cellSize);
    const gz = Math.floor(position.z / this.cellSize);
    const key = gx + "," + gz;

    if (this.requiredCells.has(key)) {
      this.visitedCells.add(key);
    }

    _tmp.copy(position).sub(this.lineCenter);

    const forwardProj = _tmp.dot(this.lineForward);
    const lateralProj = Math.abs(_tmp.dot(this.lineRight));

    if (this.prevForwardProj !== null) {
      const onLine = lateralProj <= this.cellSize * 0.5;
      const noTeleport = Math.abs(forwardProj - this.prevForwardProj) < 5;
      const crossedForward = this.prevForwardProj < 0 && forwardProj >= 0;

      if (onLine && noTeleport && crossedForward) {
        if (this.visitedCells.size === this.requiredCells.size) {
          this.completeLap();
        }

        this.visitedCells.clear();
      }
    }

    this.prevForwardProj = forwardProj;
  }

  completeLap() {
    const isBest = this.bestLap === null || this.currentLapTime < this.bestLap;

    this.lastLap = this.currentLapTime;

    if (isBest) {
      this.bestLap = this.currentLapTime;
      saveBest(this.storageKey, this.bestLap);
    }

    this.lap += 1;
    this.currentLapTime = 0;

    this.lapEl.text = String(this.lap);
    this.lastEl.text = formatTime(this.lastLap);
    this.bestEl.text = formatTime(this.bestLap);

    const color = isBest ? new Color("#5af168") : new Color("#ff6e6e");

    createColorAnimation(this.currentEl, color, 200, () => {
      createColorAnimation(this.currentEl, new Color("#ffffff"), 1000);
    });
  }
}
