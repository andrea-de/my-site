// Page script for the Jobs tab: each row opens in a sheet (a bottom sheet on phones, a centred
// panel on desktop), and the filter bar narrows the rows. Without JS, rows expand in place and
// the filter bar stays hidden.
export const jobsScript = `
	(function () {
		var sheet = document.getElementById('job-sheet');
		if (!sheet || typeof sheet.showModal !== 'function') return;
		var root = document.documentElement;
		var current = null;
		var pushed = false;

		function close(fromHistory) {
			if (!current) return;
			var job = current;
			current = null;
			var body = sheet.querySelector('.job-body');
			if (body) job.appendChild(body);
			job.open = false;
			if (sheet.open) sheet.close();
			root.classList.remove('sheet-open');
			if (pushed && !fromHistory) { pushed = false; history.back(); }
			pushed = false;
		}

		function open(job) {
			if (current === job) return;
			if (current) close(true);
			var body = job.querySelector('.job-body');
			if (!body) return;
			current = job;
			var title = job.querySelector('.j-title').innerHTML;
			var role = job.querySelector('.j-role').innerHTML;
			sheet.innerHTML = '<div class="sheet-head"><span class="sheet-grab" aria-hidden="true"></span>' +
				'<div class="sheet-title"><span class="j-title">' + title + '</span><span class="j-role">' + role + '</span></div>' +
				'<button type="button" class="sheet-close" aria-label="Close">&times;</button></div>';
			sheet.appendChild(body);
			job.open = false;
			root.classList.add('sheet-open');
			sheet.showModal();
			sheet.scrollTop = 0;
			if (location.hash !== '#' + job.id) { history.pushState({ sheet: job.id }, '', '#' + job.id); pushed = true; }
		}

		document.querySelectorAll('details.job').forEach(function (job) {
			job.querySelector('summary').addEventListener('click', function (event) {
				event.preventDefault();
				open(job);
			});
			// Opened another way (the hash, or the server after an action): show it in the sheet.
			job.addEventListener('toggle', function () { if (job.open && current !== job) open(job); });
			if (job.open) open(job);
		});
		sheet.addEventListener('click', function (event) {
			if (event.target === sheet || event.target.closest('.sheet-close')) close(false);
		});
		sheet.addEventListener('cancel', function (event) { event.preventDefault(); close(false); });
		addEventListener('popstate', function () { if (current) close(true); });

		// ---- Notes: the For Claude box says when it has unsaved changes ---------------------
		document.querySelectorAll('[data-note-form]').forEach(function (form) {
			var area = form.querySelector('textarea');
			var state = form.querySelector('.note-state');
			var saved = area.value;
			area.addEventListener('input', function () {
				var dirty = area.value !== saved;
				state.classList.toggle('is-dirty', dirty);
				if (dirty) state.textContent = area.value.trim() ? 'Unsaved changes' : 'Save to clear the note';
				else state.textContent = state.dataset.saved;
			});
		});

		// ---- Filters ----------------------------------------------------------------------
		var bar = document.querySelector('.job-filters');
		if (!bar) return;
		bar.hidden = false;
		var jobs = Array.prototype.slice.call(document.querySelectorAll('details.job'));
		var state = { q: '', quick: '', tags: {}, stage: '' };
		var quick = {
			yourturn: function (d) { return d.turn === 'you'; },
			claudeturn: function (d) { return d.turn === 'claude'; },
			ready: function (d) { return d.stage === 'drafted' && d.turn !== 'you'; },
			notyet: function (d) { return d.stage === 'not-started'; },
			waiting: function (d) { return d.stage === 'sent'; },
			opened: function (d) { return d.opened === '1'; }
		};
		function anyTag() { for (var t in state.tags) return true; return false; }
		function matches(job, skip) {
			var d = job.dataset;
			if (state.q && d.search.indexOf(state.q) < 0) return false;
			if (skip !== 'quick' && state.quick && !quick[state.quick](d)) return false;
			if (skip !== 'tags' && anyTag() && !d.tags.split(' ').some(function (t) { return state.tags[t]; })) return false;
			if (state.stage && d.stage !== state.stage) return false;
			return true;
		}
		function render() {
			var shown = 0;
			jobs.forEach(function (job) { var ok = matches(job); job.hidden = !ok; if (ok) shown++; });
			bar.querySelectorAll('[data-quick]').forEach(function (b) {
				var id = b.dataset.quick;
				b.setAttribute('aria-pressed', String(state.quick === id));
				b.querySelector('.n').textContent = jobs.filter(function (j) { return matches(j, 'quick') && quick[id](j.dataset); }).length;
			});
			bar.querySelectorAll('[data-tag]').forEach(function (b) {
				var t = b.dataset.tag;
				b.setAttribute('aria-pressed', String(!!state.tags[t]));
				b.querySelector('.n').textContent = jobs.filter(function (j) { return matches(j, 'tags') && j.dataset.tags.split(' ').indexOf(t) >= 0; }).length;
			});
			// Group headings show only while they have rows, with the visible count.
			document.querySelectorAll('.panel-jobs .group-head').forEach(function (head) {
				var list = head.tagName === 'SUMMARY' ? head.parentElement : null;
				var rows = [];
				for (var el = head.nextElementSibling; el && el.matches('details.job'); el = el.nextElementSibling) rows.push(el);
				if (list) rows = Array.prototype.slice.call(list.querySelectorAll('details.job'));
				var visible = rows.filter(function (r) { return !r.hidden; }).length;
				(list || head).hidden = rows.length > 0 && visible === 0;
				var count = head.querySelector('span');
				if (count && rows.length) count.textContent = visible;
			});
			var filtering = state.q || state.quick || anyTag() || state.stage;
			document.getElementById('jf-shown').textContent = 'Showing ' + shown + ' of ' + jobs.length;
			document.getElementById('jf-clear').hidden = !filtering;
			var none = document.querySelector('.job-none');
			if (none) none.hidden = shown > 0;
		}
		bar.addEventListener('click', function (event) {
			var b = event.target.closest('button');
			if (!b) return;
			if (b.dataset.quick) state.quick = state.quick === b.dataset.quick ? '' : b.dataset.quick;
			else if (b.dataset.tag) { if (state.tags[b.dataset.tag]) delete state.tags[b.dataset.tag]; else state.tags[b.dataset.tag] = true; }
			else if (b.id === 'jf-clear') {
				state = { q: '', quick: '', tags: {}, stage: '' };
				document.getElementById('jf-q').value = '';
				document.getElementById('jf-stage').value = '';
			}
			render();
		});
		document.getElementById('jf-q').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); render(); });
		document.getElementById('jf-stage').addEventListener('change', function (e) { state.stage = e.target.value; render(); });
		render();
	})();
`;
