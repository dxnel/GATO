let packData = {};

function switchView(viewId, event) {
    document.querySelectorAll('.content-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    event.target.classList.add('active');
}

async function initPack() {
    try {
        const response = await fetch('data.json');
        packData = await response.json();
    } catch(e) {
        console.error("Erreur de chargement JSON.");
    }
    renderPack();
}

function getRandomVars() {
    const dur = (Math.random() * 0.4 + 0.5).toFixed(2); 
    const angle = -(Math.floor(Math.random() * 20) + 15); 
    const delay = (Math.random() * 0.1).toFixed(2); 
    return `--glare-dur: ${dur}s; --glare-angle: ${angle}deg; --glare-delay: ${delay}s;`;
}

function formatDate(dateStr) {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const d = new Date(dateStr + 'T12:00:00'); // T12:00:00 prevents UTC timezone date shift
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}, ${d.getFullYear()}`;
}

function renderPack() {
    if(!packData.packaging_info) return;

    if (packData.packaging_info.assets) {
        const footerImg = document.getElementById('footer-logo');
        if(packData.packaging_info.assets.footer_logo) {
            footerImg.src = packData.packaging_info.assets.footer_logo;
            footerImg.style.display = "block";
        }
    }

    document.getElementById('warning-target').innerText = packData.packaging_info.warning;

    const ingTarget = document.getElementById('ingredients-target');
    ingTarget.innerHTML = packData.packaging_info.capabilities.map(cap => `
        <div class="cap-item">
            <div class="cap-tag">${cap.service}</div>
            <div class="cap-desc">${cap.desc}</div>
        </div>
    `).join('');

    const sortedRoster = [...packData.roster_blend].sort((a, b) => {
        const isGatoA = a.type.toUpperCase().includes("EXCLUSIVE");
        const isGatoB = b.type.toUpperCase().includes("EXCLUSIVE");
        if (isGatoA && !isGatoB) return -1;
        if (!isGatoA && isGatoB) return 1;

        const isMgmtA = a.role.toUpperCase().includes("MANAGEMENT");
        const isMgmtB = b.role.toUpperCase().includes("MANAGEMENT");
        if (isMgmtA && !isMgmtB) return -1;
        if (!isMgmtA && isMgmtB) return 1;

        return a.name.localeCompare(b.name);
    });
    
    const sortedReleases = [...packData.batch_releases].sort((a, b) => {
        return new Date(b.release_date) - new Date(a.release_date);
    });

    // Filtres pour séparer Label (Original Blend) et Distro (Imported Pipeline)
    const labelRoster = sortedRoster.filter(a => !a.type.toLowerCase().includes("distribution"));
    const distroRoster = sortedRoster.filter(a => a.type.toLowerCase().includes("distribution"));

    // Rendu Onglet 1 : LABEL (Original Blend)
    const rosterLabelTarget = document.getElementById('roster-label-target');
    rosterLabelTarget.innerHTML = labelRoster.map(art => {
        return `
            <div class="item-row" style="${getRandomVars()}" onclick="openModal('artist', '${art.id}')">
                <div class="cellophane-wrapper"></div>
                <div class="item-type">${art.type}</div>
                <div class="item-details">
                    <div class="item-name instrument-serif">${art.name}</div>
                    <div class="item-role">${art.role}</div>
                </div>
                <img src="${art.image || ''}" class="row-thumb" alt="${art.name}">
            </div>
        `;
    }).join('');

    // Rendu Onglet 2 : DISTRIBUTION (Imported Pipeline)
    // -> On ajoute la classe "distro-item" pour que le CSS le mette en noir
    const rosterDistroTarget = document.getElementById('roster-distro-target');
    rosterDistroTarget.innerHTML = distroRoster.map(art => {
        return `
            <div class="item-row distro-item" style="${getRandomVars()}" onclick="openModal('artist', '${art.id}')">
                <div class="cellophane-wrapper"></div>
                <div class="item-type">${art.type}</div>
                <div class="item-details">
                    <div class="item-name instrument-serif">${art.name}</div>
                    <div class="item-role">${art.role}</div>
                </div>
                <img src="${art.image || ''}" class="row-thumb" alt="${art.name}">
            </div>
        `;
    }).join('');

    // Rendu Onglet 3 : RELEASES MIXTES
    const relTarget = document.getElementById('releases-target');
    relTarget.innerHTML = sortedReleases.map(rel => {
        const artistData = packData.roster_blend.find(a => a.name === rel.artist);
        const isDistroRelease = artistData && artistData.type.toLowerCase().includes("distribution");
        const isUpcoming = new Date(rel.release_date + 'T12:00:00') > new Date();
        
        let formatDisplay = rel.format;
        let typeStyle = '';
        
        if (isUpcoming) {
            formatDisplay = `${rel.format} · SOON`;
            if (!isDistroRelease) {
                typeStyle = 'style="background: #111; color: #fff;"';
            }
        }

        return `
        <div class="release-card ${isDistroRelease ? 'distro-release' : ''}" style="${getRandomVars()}" onclick="openModal('release', '${rel.id}')">
            <div class="cellophane-wrapper"></div>
            <div class="item-type" ${typeStyle}>${formatDisplay}</div>
            <div class="release-cover-wrapper">
                <img src="${rel.cover || ''}" class="release-cover" alt="${rel.title}">
            </div>
            <div class="release-info">
                <div class="item-name instrument-serif">${rel.title}</div>
                <div class="item-role">BY ${rel.artist}</div>
                <div class="item-batch">${formatDate(rel.release_date)}</div>
            </div>
        </div>
        `;
    }).join('');
    
    // Updates Tab counts
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length >= 3) {
        tabs[0].innerText = `ROSTER (${labelRoster.length})`;
        tabs[1].innerText = `PARTNERS (${distroRoster.length})`;
        tabs[2].innerText = `RELEASES (${sortedReleases.length})`;
    }
}

function openModal(type, id) {
    const container = document.getElementById('pack-modal');
    const actionContainer = document.getElementById('modal-action-container');
    const socialContainer = document.getElementById('modal-socials');
    
    actionContainer.innerHTML = '';
    socialContainer.innerHTML = '';

    if (type === 'artist') {
        const art = packData.roster_blend.find(a => a.id === id);
        document.getElementById('modal-img').src = art.image || '';
        document.getElementById('modal-type').innerText = art.type;
        document.getElementById('modal-type').style.background = art.type.toLowerCase().includes("distribution") ? "#111" : "#A81A1A";
        
        document.getElementById('modal-title').innerText = art.name;
        document.getElementById('modal-role').innerText = art.role;
        document.getElementById('modal-desc').innerText = art.desc;
        
        if(art.socials) {
            for (const [platform, url] of Object.entries(art.socials)) {
                socialContainer.innerHTML += `<a href="${url}" target="_blank" class="social-btn">${platform} ↗\uFE0E</a>`;
            }
        }
    } else {
        const rel = packData.batch_releases.find(r => r.id === id);
        
        const artistData = packData.roster_blend.find(a => a.name === rel.artist);
        const isDistroRelease = artistData && artistData.type.toLowerCase().includes("distribution");
        
        document.getElementById('modal-img').src = rel.cover || '';
        document.getElementById('modal-type').innerText = rel.format;
        document.getElementById('modal-type').style.background = isDistroRelease ? "#111" : "#A81A1A";

        document.getElementById('modal-title').innerText = rel.title;
        document.getElementById('modal-role').innerText = `BY ${rel.artist} ● ${formatDate(rel.release_date)}`;
        document.getElementById('modal-desc').innerText = rel.desc || "AUDIO PACKAGED AND DISTRIBUTED UNDER GATO CERTIFICATION.";
        
        if (rel.link && rel.link !== "#") {
            actionContainer.innerHTML = `<a href="${rel.link}" class="modal-action">TEAR OPEN // LISTEN ↗\uFE0E</a>`;
        } else {
            actionContainer.innerHTML = `<div style="text-align:center; font-size:11px; font-weight:900; color:#999; letter-spacing:2px; margin-top:10px; padding:14px; border:2px dashed #ccc;">NOT YET AVAILABLE</div>`;
        }
    }
    container.classList.add('active');
}

function closeModal(e) {
    if (e.target.id === 'pack-modal') forceClose();
}
function forceClose() {
    document.getElementById('pack-modal').classList.remove('active');
}

window.onload = initPack;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') forceClose();
});