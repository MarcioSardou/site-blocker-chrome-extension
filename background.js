// Carrega as regras de bloqueio ao iniciar
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    updateBlockRules(data.blockedSites);
  });
});

// Função para atualizar as regras de bloqueio
function updateBlockRules(blockedSites) {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const ruleIdsToRemove = existingRules.map((rule) => rule.id);

    chrome.declarativeNetRequest.updateDynamicRules(
      {
        removeRuleIds: ruleIdsToRemove,
      },
      () => {
        const newRules = blockedSites.map((site, index) => ({
          id: index + 1,
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: `||${site}^`,
            resourceTypes: ["main_frame"],
          },
        }));
        chrome.declarativeNetRequest.updateDynamicRules({
          addRules: newRules,
        });
      }
    );
  });
}