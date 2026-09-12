<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let src = '/resume-preview.png';
	export let alt = 'Andrea de Candia Resume Preview';

	let zoomLevel = 100; // in percent: 100 to 260
	let viewportElement;
	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let scrollLeft = 0;
	let scrollTop = 0;

	// Pinch-to-zoom tracking for mobile touch screens
	let initialPinchDistance = null;
	let initialPinchZoom = 100;
	let lastTapTime = 0;

	function zoomIn() {
		zoomLevel = Math.min(260, Math.round((zoomLevel + 30) / 10) * 10);
	}

	function zoomOut() {
		zoomLevel = Math.max(100, Math.round((zoomLevel - 30) / 10) * 10);
	}

	function resetZoom() {
		zoomLevel = 100;
		if (viewportElement) {
			viewportElement.scrollLeft = 0;
			viewportElement.scrollTop = 0;
		}
	}

	function cycleZoom() {
		if (zoomLevel <= 110) {
			zoomLevel = 160;
		} else if (zoomLevel <= 180) {
			zoomLevel = 220;
		} else {
			resetZoom();
		}
	}

	// Double-tap or double-click to toggle zoom
	function handleImageClick(e) {
		const now = Date.now();
		if (now - lastTapTime < 350) {
			// Double tap detected
			if (zoomLevel > 100) {
				resetZoom();
			} else {
				zoomLevel = 180;
				// Center near click
				if (viewportElement) {
					const rect = viewportElement.getBoundingClientRect();
					const clickX = e.clientX - rect.left;
					const clickY = e.clientY - rect.top;
					setTimeout(() => {
						viewportElement.scrollLeft = clickX * 1.8 - rect.width / 2;
						viewportElement.scrollTop = clickY * 1.8 - rect.height / 2;
					}, 20);
				}
			}
			lastTapTime = 0;
		} else {
			lastTapTime = now;
		}
	}

	// Mouse drag-to-pan handlers (Desktop)
	function handleMouseDown(e) {
		if (zoomLevel <= 100 || !viewportElement) return;
		isDragging = true;
		startX = e.pageX - viewportElement.offsetLeft;
		startY = e.pageY - viewportElement.offsetTop;
		scrollLeft = viewportElement.scrollLeft;
		scrollTop = viewportElement.scrollTop;
	}

	function handleMouseMove(e) {
		if (!isDragging || !viewportElement) return;
		e.preventDefault();
		const x = e.pageX - viewportElement.offsetLeft;
		const y = e.pageY - viewportElement.offsetTop;
		const walkX = (x - startX) * 1.2;
		const walkY = (y - startY) * 1.2;
		viewportElement.scrollLeft = scrollLeft - walkX;
		viewportElement.scrollTop = scrollTop - walkY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Touch pinch-to-zoom handlers (Mobile)
	function handleTouchStart(e) {
		if (e.touches.length === 2) {
			const touch1 = e.touches[0];
			const touch2 = e.touches[1];
			initialPinchDistance = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY
			);
			initialPinchZoom = zoomLevel;
		}
	}

	function handleTouchMove(e) {
		if (e.touches.length === 2 && initialPinchDistance) {
			e.preventDefault();
			const touch1 = e.touches[0];
			const touch2 = e.touches[1];
			const currentDistance = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY
			);
			const ratio = currentDistance / initialPinchDistance;
			const nextZoom = Math.min(260, Math.max(100, Math.round(initialPinchZoom * ratio)));
			zoomLevel = nextZoom;
		}
	}

	function handleTouchEnd(e) {
		if (e.touches.length < 2) {
			initialPinchDistance = null;
		}
	}

	onMount(() => {
		const handleGlobalMouseUp = () => {
			isDragging = false;
		};
		window.addEventListener('mouseup', handleGlobalMouseUp);
		return () => {
			window.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	});
</script>

<div class="zoom-viewer-container">
	<!-- Zoom Control Toolbar -->
	<div class="zoom-toolbar">
		<div class="zoom-group">
			<button
				type="button"
				class="zoom-btn icon-btn"
				on:click={zoomOut}
				disabled={zoomLevel <= 100}
				title="Zoom Out"
				aria-label="Zoom out"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>

			<button
				type="button"
				class="zoom-indicator-btn"
				on:click={cycleZoom}
				title="Click to cycle zoom (100% &bull; 160% &bull; 220%)"
			>
				{zoomLevel}%
			</button>

			<button
				type="button"
				class="zoom-btn icon-btn"
				on:click={zoomIn}
				disabled={zoomLevel >= 260}
				title="Zoom In"
				aria-label="Zoom in"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>
		</div>

		<div class="zoom-actions">
			<button
				type="button"
				class="zoom-text-btn"
				on:click={resetZoom}
				disabled={zoomLevel === 100}
				title="Reset to Fit Width"
			>
				Fit
			</button>

			<a
				href={src}
				target="_blank"
				rel="noopener"
				class="zoom-text-btn fullscreen-btn"
				title="Open full-resolution image in new tab"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
					<polyline points="15 3 21 3 21 9" />
					<polyline points="9 21 3 21 3 15" />
					<line x1="21" y1="3" x2="14" y2="10" />
					<line x1="3" y1="21" x2="10" y2="14" />
				</svg>
				<span class="btn-label">Full</span>
			</a>
		</div>
	</div>

	<!-- Scrollable Zoom Viewport -->
	<div
		bind:this={viewportElement}
		class="zoom-viewport"
		class:is-zoomed={zoomLevel > 100}
		class:is-dragging={isDragging}
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
		role="region"
		aria-label="Zoomable Resume Preview"
	>
		<div class="image-inner-stage" style="width: {zoomLevel}%;">
			<img
				{src}
				{alt}
				class="preview-img"
				on:click={handleImageClick}
				draggable="false"
				loading="eager"
			/>
		</div>
	</div>

	<!-- Bottom Gestures Helper Strip -->
	<div class="zoom-helper-strip">
		<span>✦ Double-tap to toggle zoom &bull; Drag to pan when zoomed</span>
	</div>
</div>

<style>
	.zoom-viewer-container {
		width: 100%;
		max-width: 900px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin: 0 auto;
	}

	/* Zoom Toolbar */
	.zoom-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 420px;
		background: rgba(20, 20, 20, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 10px;
		padding: 4px 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
	}

	.zoom-group {
		display: flex;
		align-items: center;
		gap: 3px;
	}

	.zoom-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #ededed;
		width: 30px;
		height: 30px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.zoom-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.18);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.25);
	}

	.zoom-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.btn-icon {
		width: 14px;
		height: 14px;
	}

	.btn-icon-sm {
		width: 12px;
		height: 12px;
	}

	.zoom-indicator-btn {
		background: transparent;
		border: none;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 700;
		padding: 0 8px;
		min-width: 48px;
		height: 30px;
		cursor: pointer;
		font-variant-numeric: tabular-nums;
		border-radius: 4px;
		transition: background 0.15s ease;
	}

	.zoom-indicator-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.zoom-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.zoom-text-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #cccccc;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 6px;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		transition: all 0.15s ease;
	}

	.zoom-text-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.16);
		color: #ffffff;
	}

	.zoom-text-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* Scrollable Zoom Viewport */
	.zoom-viewport {
		width: 100%;
		max-height: calc(100vh - 200px);
		min-height: 520px;
		overflow: auto;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-x pan-y pinch-zoom;
		background: #0f0f0f;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		cursor: zoom-in;
	}

	.zoom-viewport.is-zoomed {
		cursor: grab;
		justify-content: flex-start;
	}

	.zoom-viewport.is-dragging {
		cursor: grabbing;
		user-select: none;
	}

	.image-inner-stage {
		display: flex;
		justify-content: center;
		margin: 0 auto;
		transition: width 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		flex-shrink: 0;
	}

	.preview-img {
		width: 100%;
		height: auto;
		display: block;
		background: #ffffff;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	/* Helper Strip */
	.zoom-helper-strip {
		font-size: 0.75rem;
		color: #777777;
		font-weight: 500;
		text-align: center;
	}

	@media (max-width: 640px) {
		.zoom-viewport {
			max-height: calc(100vh - 220px);
			min-height: 440px;
			border-radius: 8px;
		}

		.zoom-toolbar {
			max-width: 340px;
		}

		.btn-label {
			display: none;
		}

		.zoom-text-btn {
			padding: 4px 8px;
		}
	}
</style>
