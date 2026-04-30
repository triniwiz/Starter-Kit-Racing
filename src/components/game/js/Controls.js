/*
export class Controls {

	constructor() {

		this.keys = {};
		this.x = 0;
		this.z = 0;

		// Touch state
		this.touchActive = false;
		this.touchDirX = 0;
		this.touchDirY = 0;
		this.steerPointerId = null;
		this.steerStartX = 0;
		this.steerStartY = 0;

		window.addEventListener( 'keydown', ( e ) => this.keys[ e.code ] = true );
		window.addEventListener( 'keyup', ( e ) => this.keys[ e.code ] = false );

		this.setupTouchUI();

	}

	setupTouchUI() {


		if ( ! ( 'ontouchstart' in window ) ) return;

		const css = document.createElement( 'style' );
		css.textContent = `
			.touch-controls { position: absolute; bottom: 0; left: 0; right: 0; height: 50%; pointer-events: none; z-index: 10; }
			.steer-zone { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; pointer-events: auto; touch-action: none; }
			.steer-base { position: absolute; bottom: 32px; left: 32px; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); }
			.steer-knob { position: absolute; top: 50%; left: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,0.35); }
		`;
		document.head.appendChild( css );

		const container = document.createElement( 'div' );
		container.className = 'touch-controls';

		const steerZone = document.createElement( 'div' );
		steerZone.className = 'steer-zone';

		const base = document.createElement( 'div' );
		base.className = 'steer-base';
		const knob = document.createElement( 'div' );
		knob.className = 'steer-knob';
		base.appendChild( knob );
		steerZone.appendChild( base );

		container.appendChild( steerZone );
		document.body.appendChild( container );

		const steerRange = 40;

		steerZone.addEventListener( 'pointerdown', ( e ) => {

			if ( this.steerPointerId !== null ) return;
			steerZone.setPointerCapture( e.pointerId );
			this.steerPointerId = e.pointerId;
			this.steerStartX = e.clientX;
			this.steerStartY = e.clientY;
			this.touchActive = true;
			this.touchDirX = 0;
			this.touchDirY = 0;

		} );

		steerZone.addEventListener( 'pointermove', ( e ) => {

			if ( e.pointerId !== this.steerPointerId ) return;
			let dx = ( e.clientX - this.steerStartX ) / steerRange;
			let dy = ( e.clientY - this.steerStartY ) / steerRange;
			const mag = Math.sqrt( dx * dx + dy * dy );

			if ( mag > 1 ) {

				dx /= mag;
				dy /= mag;

			}

			this.touchDirX = dx;
			this.touchDirY = dy;
			knob.style.transform = `translate(${ this.touchDirX * 60 }px, ${ this.touchDirY * 60 }px)`;

		} );

		const endSteer = ( e ) => {

			if ( e.pointerId !== this.steerPointerId ) return;
			this.steerPointerId = null;
			this.touchActive = false;
			this.touchDirX = 0;
			this.touchDirY = 0;
			knob.style.transform = '';

		};

		steerZone.addEventListener( 'pointerup', endSteer );
		steerZone.addEventListener( 'pointercancel', endSteer );

	}

	update() {

		let x = 0, z = 0;

		// Keyboard

		if ( this.keys[ 'KeyA' ] || this.keys[ 'ArrowLeft' ] ) x -= 1;
		if ( this.keys[ 'KeyD' ] || this.keys[ 'ArrowRight' ] ) x += 1;
		if ( this.keys[ 'KeyW' ] || this.keys[ 'ArrowUp' ] ) z += 1;
		if ( this.keys[ 'KeyS' ] || this.keys[ 'ArrowDown' ] ) z -= 1;

		// Gamepad

		const gamepads = navigator.getGamepads();

		for ( const gp of gamepads ) {

			if ( ! gp ) continue;

			const stickX = gp.axes[ 0 ];
			if ( Math.abs( stickX ) > 0.15 ) x = stickX;

			const rt = gp.buttons[ 7 ] ? gp.buttons[ 7 ].value : 0;
			const lt = gp.buttons[ 6 ] ? gp.buttons[ 6 ].value : 0;

			if ( rt > 0.1 || lt > 0.1 ) z = rt - lt;

			break;

		}

		// Touch — joystick mapped to world space (camera is 45° azimuth)

		if ( this.touchActive ) {

			const jx = this.touchDirX;
			const jy = this.touchDirY;
			const mag = Math.sqrt( jx * jx + jy * jy );

			if ( mag > 0.15 ) {

				x = ( jx + jy ) * Math.SQRT1_2 / mag;
				z = ( - jx + jy ) * Math.SQRT1_2 / mag;

			}

		}

		this.x = x;
		this.z = z;

		return { x, z, touchActive: this.touchActive };

	}

}
*/

import { AbsoluteLayout, StackLayout } from "@nativescript/core";

export class Controls {
  constructor(canvas) {
    this.page = canvas.page;

    this.keys = {};
    this.x = 0;
    this.z = 0;

    // Touch state
    this.touchActive = false;
    this.touchDirX = 0;
    this.touchDirY = 0;

    this.steerStartX = 0;
    this.steerStartY = 0;

    // Keyboard (works if you have a WebView or custom bridge)
    if (global.isWeb) {
      window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
      window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
    }

    this.setupTouchUI();
  }

  setupTouchUI() {
    const container = new AbsoluteLayout();
    container.width = "100%";
    container.height = "100%";
    container.isUserInteractionEnabled = false;

    if (__ANDROID__) {
      container.on("loaded", () => {
        container.nativeView.setClipChildren(false);
        container.nativeView.setClipToPadding(false);
      });
    }

    const steerZone = new AbsoluteLayout();
    steerZone.width = "100%";
    steerZone.height = "100%";
    steerZone.isUserInteractionEnabled = true;

    if (__ANDROID__) {
      steerZone.on("loaded", () => {
        steerZone.nativeView.setClipChildren(false);
        steerZone.nativeView.setClipToPadding(false);
      });
    }

    // Base (hidden initially)
    const base = new StackLayout();
    base.width = 140;
    base.height = 140;
    base.borderRadius = 70;
    base.backgroundColor = "rgba(255,255,255,0.1)";
    base.borderWidth = 2;
    base.opacity = 0;

    if (__ANDROID__) {
      base.on("loaded", () => {
        base.nativeView.setClipChildren(false);
        base.nativeView.setClipToPadding(false);
      });
    }

    // Knob
    const knob = new StackLayout();
    knob.width = 60;
    knob.height = 60;
    knob.borderRadius = 30;
    knob.backgroundColor = "rgba(255,255,255,0.35)";

    base.addChild(knob);
    steerZone.addChild(base);
    container.addChild(steerZone);

    container.id = "touch-controls";

    this.page.content.addChild(container);

    this.initJoystick(steerZone, base, knob);
  }

  initJoystick(steerZone, base, knob) {
    const MAX_RADIUS = 60;
    const DEADZONE = 0.12;
    const SMOOTH = 0.2;

    let targetX = 0;
    let targetY = 0;

    steerZone.on("touch", (args) => {
      const action = args.action;
      const x = args.getX();
      const y = args.getY();

      if (action === "down") {
        this.touchActive = true;

        // Floating base
        this.steerStartX = x;
        this.steerStartY = y;

        base.translateX = x - 70;
        base.translateY = y - 70;
        base.opacity = 1;

        this.touchDirX = 0;
        this.touchDirY = 0;

        targetX = 0;
        targetY = 0;
      }

      if (action === "move" && this.touchActive) {
        let dx = x - this.steerStartX;
        let dy = y - this.steerStartY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        // Clamp to circle
        if (dist > MAX_RADIUS) {
          dx = (dx / dist) * MAX_RADIUS;
          dy = (dy / dist) * MAX_RADIUS;
        }

        // Normalize
        let nx = dx / MAX_RADIUS;
        let ny = dy / MAX_RADIUS;

        const mag = Math.sqrt(nx * nx + ny * ny);

        // Deadzone + rescale
        if (mag < DEADZONE) {
          nx = 0;
          ny = 0;
        } else {
          const scaled = (mag - DEADZONE) / (1 - DEADZONE);
          nx = (nx / mag) * scaled;
          ny = (ny / mag) * scaled;
        }

        targetX = nx;
        targetY = ny;

        // Move knob visually
        knob.translateX = dx;
        knob.translateY = dy;
      }

      if (action === "up" || action === "cancel") {
        this.touchActive = false;

        targetX = 0;
        targetY = 0;

        base.opacity = 0;

        // Snap back animation
        knob.animate({
          translate: { x: 0, y: 0 },
          duration: 120,
          curve: "easeOut",
        });
      }
    });

    // Smoothing loop
    const loop = () => {
      this.touchDirX += (targetX - this.touchDirX) * SMOOTH;
      this.touchDirY += (targetY - this.touchDirY) * SMOOTH;

      requestAnimationFrame(loop);
    };

    loop();
  }

  update() {
    let x = 0,
      z = 0;

    // Keyboard
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) x += 1;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) z += 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) z -= 1;

    // Gamepad (only works if available in your environment)
    if (global.isWeb && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();

      for (const gp of gamepads) {
        if (!gp) continue;

        const stickX = gp.axes[0];
        if (Math.abs(stickX) > 0.15) x = stickX;

        const rt = gp.buttons[7] ? gp.buttons[7].value : 0;
        const lt = gp.buttons[6] ? gp.buttons[6].value : 0;

        if (rt > 0.1 || lt > 0.1) z = rt - lt;

        break;
      }
    }

    // Touch → world space (45° camera)
    if (this.touchActive) {
      const jx = this.touchDirX;
      const jy = this.touchDirY;
      const mag = Math.sqrt(jx * jx + jy * jy);

      if (mag > 0.15) {
        x = ((jx + jy) * Math.SQRT1_2) / mag;
        z = ((-jx + jy) * Math.SQRT1_2) / mag;
      }
    }

    this.x = x;
    this.z = z;

    return { x, z, touchActive: this.touchActive };
  }
}
