'use strict';

const pattern = /^https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,}$/;

// Saves new options to chrome.storage
function save_options() {
  var status = document.getElementById('options-status');
  var jira = document.getElementById('options-jira-url').value;
  if (!pattern.test(jira)) {
    status.textContent = chrome.i18n.getMessage('invalidURL');
  } else {
    if (jira.charAt(jira.length - 1) != '/') {
      jira = jira + '/';
      document.getElementById('options-jira-url').value = jira;
    }
    var proj = document.getElementById('options-proj').value.toLocaleUpperCase();
    var tab = document.getElementById('options-tab').selectedIndex;
    chrome.storage.sync.set({
      jiraURL: jira,
      jiraProj: proj,
      tabOpt: tab
    }, function() {
      // Update status to let user know options were saved.
      status.textContent = chrome.i18n.getMessage('savedOptions');
      setTimeout(function() {
        status.textContent = '';
      }, 2000);
    });
  }
}

//Clears all options in chrome.storage.
function clear_options() {
  var status = document.getElementById('options-status');
  chrome.storage.sync.clear(function() {
    // Update status to let user know options were saved.
    status.textContent = chrome.i18n.getMessage('clearedOptions');
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
  document.getElementById('options-jira-url').value = '';
  document.getElementById('options-proj').value = '';
  document.getElementById('options-tab').selectedIndex = 1;
}

// Restores default JIRA URL and user preferences using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    jiraURL: '',
    jiraProj: '',
    tabOpt: '1'
  }, function(options) {
    document.getElementById('options-jira-url').value = options.jiraURL;
    document.getElementById('options-proj').value = options.jiraProj;
    document.getElementById('options-tab').selectedIndex = options.tabOpt;
  });
}

document.addEventListener('DOMContentLoaded', restore_options, false);
document.addEventListener('keypress', function(e) {
  var key = e.which || e.keyCode;
  if (key === 13) {
    save_options();
  }
});
document.getElementById('options-save').addEventListener('click', save_options, false);
document.getElementById('options-clear').addEventListener('click', clear_options, false);