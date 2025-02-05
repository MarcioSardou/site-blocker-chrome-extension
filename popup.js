// Elementos do DOM
const blockBtn = document.getElementById('block-btn');
const unblockBtn = document.getElementById('unblock-btn');
const blockedSitesList = document.getElementById('blocked-sites-list');

// Função para carregar e exibir a lista de sites bloqueados
function loadBlockedSites() {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    blockedSitesList.innerHTML = ''; // Limpa a lista atual
    data.blockedSites.forEach((site, index) => {
      const li = document.createElement('li');
      li.textContent = site;
      blockedSitesList.appendChild(li);
    });
  });
}

// Função para adicionar o site atual à lista de bloqueados
blockBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const blockedSites = data.blockedSites;
      if (!blockedSites.includes(domain)) {
        blockedSites.push(domain);
        chrome.storage.sync.set({ blockedSites }, () => {
          updateBlockRules(blockedSites, () => {
            // Recarrega a guia atual após bloquear o site
            chrome.tabs.reload(tabs[0].id);
            loadBlockedSites();
          });
        });
      }
    });
  });
});

// Função para remover o site atual da lista de bloqueados
unblockBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const blockedSites = data.blockedSites.filter(site => site !== domain);
      chrome.storage.sync.set({ blockedSites }, () => {
        updateBlockRules(blockedSites, () => {
          // Recarrega a guia atual após desbloquear o site
          chrome.tabs.reload(tabs[0].id);
          loadBlockedSites();
        });
      });
    });
  });
});

// Função para remover um site da lista pelo índice
function removeBlockedSite(index) {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    const blockedSites = data.blockedSites;
    blockedSites.splice(index, 1);
    chrome.storage.sync.set({ blockedSites }, () => {
      updateBlockRules(blockedSites, () => {
        loadBlockedSites();
      });
    });
  });
}

// Função para atualizar as regras de bloqueio
function updateBlockRules(blockedSites, callback) {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIdsToRemove = existingRules.map(rule => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove
    }, () => {
      const newRules = blockedSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: `||${site}^`,
          resourceTypes: ["main_frame"]
        }
      }));
      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules
      }, callback);
    });
  });
}

// Carrega a lista de sites bloqueados ao abrir o popup
loadBlockedSites();