/* eslint-disable */

// set extension defaults here
var JIRA_HOSTNAME = window.location.hostname;
var LINKED_COLUMNS = ["To Do", "In Progress", "QA Queue", "In Review"];
var JIRA_COLUMNS = [];
var IGNORE_LINK_TYPES = ["Cloners", "Issue Split", "Relates"];

// get settings for the chrome extension
chrome.storage.sync.get({
    link_columns: "",
    ignore_link_types: ""
}, function (items) {


      if (items.link_columns) {
        LINKED_COLUMNS = items.link_columns
            .split(",")
            .map(function (element) {
                return element.trim();
            });
      }

      if (items.ignore_link_types) {
        IGNORE_LINK_TYPES = items.ignore_link_types
            .split(",")
            .map(function (element) {
                return element.trim();
            });
      }

      setTimeout(addLinks, 1500);
});

function populateIssueCard(card) {
    $.getJSON("https://" + JIRA_HOSTNAME + "/rest/api/latest/issue/" + $(card).attr("data-issue-key"), function (data) {
      if (data.fields.issuelinks.length > 0) {
            var card_content = $(card).find(".ghx-issue-content");
            var wrapper = undefined

            $.each(data.fields.issuelinks, function () {
                var link_type
                var linked_issue_key
                var linked_issue_status
                var linked_issue_status_category
                var linked_issue_summary
                var linked_url
                var inward = false

                if(IGNORE_LINK_TYPES.includes(this.type.name)){
                  return true
                }

                if (wrapper === undefined) {
                  if (card_content.length) {
                    $(card_content).append("<div class=\"link-status-in-jira-wrapper\"></div>");
                  } else {
                    $(card).append("<div class=\"link-status-in-jira-wrapper\"></div>");
                  }

                  wrapper = $(card).find(".link-status-in-jira-wrapper");
                  $(wrapper).append("<div class=\"link-heading\">Linked Issues</div>");
                }

                if (this["inwardIssue"]) {
                  link_type = this.type.inward
                  linked_issue_key = this.inwardIssue.key
                  linked_issue_status = this.inwardIssue.fields.status.name
                  linked_issue_status_category = this.inwardIssue.fields.status.statusCategory.name
                  linked_issue_summary = this.inwardIssue.fields.summary
                  linked_url = this.inwardIssue.self
                  inward = true
                } else {
                  link_type = this.type.outward
                  linked_issue_key = this.outwardIssue.key
                  linked_issue_status = this.outwardIssue.fields.status.name
                  linked_issue_status_category = this.outwardIssue.fields.status.statusCategory.name
                  linked_issue_summary = this.outwardIssue.fields.summary
                  linked_url = this.outwardIssue.self
                }

                var linkedIssueNode = document.createElement("div");
                linkedIssueNode.classList.add("linkInfoNode");
                linkedIssueNode.setAttribute("data-ticket-pull-id", $(card).data("issue-key"));

                $.getJSON(linked_url, function (data) {

                  var linked_sprint = "Not Scheduled"
                  if (data.fields.customfield_10020) {
                    $.each(data.fields.customfield_10020, function () {
                      linked_sprint = this.name
                    })
                  }

                  $(linkedIssueNode).append("<span style=\"cursor:pointer;font-size:12px;color: rgb(107, 119, 140);\" data-tooltip=\"" + linked_issue_summary + " - " + linked_sprint + "\"> " + link_type + " " + linked_issue_key + "</span> ");

                  $(linkedIssueNode).append(linkStatus(linked_issue_status, linked_issue_status_category, inward));

                  $(wrapper).append(linkedIssueNode);

                })



                    });
                }
            });
        }

function addLinks() {


    if ($(".link-status-in-jira-wrapper").length == 0) {

        // We don't care to rebuild this list multiple times if we have
        // already determined it once
        if (!JIRA_COLUMNS.length) {
            $.each($("#ghx-column-headers .ghx-column h2"), function () {
                var column_text = $(this).text();

                if (LINKED_COLUMNS.indexOf(column_text) !== -1) {

                    JIRA_COLUMNS.push($(this).parent().parent().parent().attr("data-id"));
                }
            });
        }

        // select the right columns if there are multiple, and search for all cards in those
        // columns afterwards
        var allSelectors = '[id="ghx-backlog-column"] .ghx-issue-compact'

        var columnSelectors = JIRA_COLUMNS.map(function (element) {
            return '[data-column-id="' + element + '"] .ghx-issue';
        }).join(', ');

        if (columnSelectors) {
          allSelectors = allSelectors.concat(`, ${columnSelectors}`)
        }

        var cards = document.querySelectorAll(allSelectors);


        Array.prototype.forEach.call(cards, function (card) {
            populateIssueCard(card);
        });


    }
    setTimeout(addLinks, 1500);
}

function linkStatus(status, statusCategory, subtle) {
  if (subtle == true){
    subtle = "aui-lozenge-subtle"
  }
  switch (statusCategory) {
      case "In Progress":
          return `<span class=\"aui-lozenge aui-lozenge-moved ${subtle}\">${status}</span>`;
          break;
      case "Done":
          return `<span class=\"aui-lozenge aui-lozenge-success ${subtle}\">${status}</span>`;
          break;
      case "To Do":
          return `<span class=\"aui-lozenge aui-lozenge-error ${subtle}\">${status}</span>`;
          break;
      default:
          return `<span class=\"aui-lozenge aui-lozenge-overflow aui-lozenge-subtle\" style=\"color:#a8a8a8 border-color:#a8a8a8\">${status}</span>`;
  }
}

/* Helper Functions */

const removeArrayItem = (arr, itemToRemove) => {
    return arr.filter(item => item !== itemToRemove)
}

function idealTextColor(bgColor) {
    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}

function getRGBComponents(color) {
    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);

    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
}
