/* eslint-disable */

// Saves options to chrome.storage
function save_options() {

    var link_columns = document.getElementById('link_columns').value;
    var ignore_link_types = document.getElementById('ignore_link_types').value;

    chrome.storage.sync.set({
        link_columns: link_columns,
        ignore_link_types: ignore_link_types
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1250);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        link_columns: 'In Review, Github Review',
        ignore_link_types: 'Cloners, Issue Split, Relates'
    }, function (items) {
        document.getElementById('link_columns').value = items.link_columns;
        document.getElementById('ignore_link_types').value = items.ignore_link_types
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
