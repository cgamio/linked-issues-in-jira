/* eslint-disable */

// set extension defaults here
var JIRA_HOSTNAME = window.location.hostname;
var LINKED_COLUMNS = ["To Do", "In Progress", "QA Queue", "In Review"];
var JIRA_COLUMNS = [];

NO_PR_ICON = "<svg viewBox=\"0 0 12 16\" version=\"1.1\" width=\"12\" height=\"16\" aria-hidden=\"true\"><path fill=\"#ccc\" fill-rule=\"evenodd\" d=\"M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"></path></svg>";
var PR_ICON = "<svg viewBox=\"0 0 12 16\" version=\"1.1\" width=\"12\" height=\"16\" aria-hidden=\"true\"><path fill=\"#555\" fill-rule=\"evenodd\" d=\"M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z\"></path></svg>";

// get settings for the chrome extension
chrome.storage.sync.get({
    linked_columns: "",
}, function (items) {


      if (items.linked_columns) {
        LINKED_COLUMNS = items.linked_columns
            .split(",")
            .map(function (element) {
                return element.trim();
            });
      }

      setTimeout(addPRLabels, 1500);

});

// Listen for a click on our tab to fire off our function
window.addEventListener("message", function (event) {
    if (event.source != window)
        return;
    switch (event.data.type) {
        case "refreshPRs":
            $("[data-issue-id='" + event.data.params.issueKey + "']").find(".link-status-in-jira-wrapper").remove();
            populateIssueCard($("[data-issue-id='" + event.data.params.issueKey + "']"));
            break;
    }
});

function populateIssueCard(card) {
  console.log("Populating card " + $(card).attr("data-issue-key"))
    $.getJSON("https://" + JIRA_HOSTNAME + "/rest/api/latest/issue/" + $(card).attr("data-issue-key"), function (data) {
      if (data.fields.issuelinks.length > 0) {

            $(card).append("<div class=\"link-status-in-jira-wrapper\"></div>");
            var wrapper = $(card).find(".link-status-in-jira-wrapper");

            // heading for pull requests
            $(wrapper).append("<div class=\"pr-heading\">Linked Issues</div>");

            $.each(data.fields.issuelinks, function () {
                var link_type
                var linked_issue_key
                var linked_issue_status
                var linked_issue_summary
                var linked_url

                if (this["inwardIssue"]) {
                  link_type = this.type.inward
                  linked_issue_key = this.inwardIssue.key
                  linked_issue_status = this.inwardIssue.fields.status.name
                  linked_issue_summary = this.inwardIssue.fields.summary
                  linked_url = this.inwardIssue.self
                } else {
                  link_type = this.type.outward
                  linked_issue_key = this.outwardIssue.key
                  linked_issue_status = this.outwardIssue.fields.status.name
                  linked_issue_summary = this.outwardIssue.fields.summary
                  linked_url = this.outwardIssue.self
                }

                var linkedIssueNode = document.createElement("div");
                linkedIssueNode.classList.add("pullRequestNode");
                linkedIssueNode.setAttribute("data-ticket-pull-id", $(card).data("issue-key"));

                $.getJSON(linked_url, function (data) {
                  var linked_sprint = "Not Scheduled"
                  console.log(`Checking sprints for: ${linked_issue_key} - ${linked_url}`)
                  if (data.fields.customfield_10020) {
                    $.each(data.fields.customfield_10020, function () {
                      console.log(`Sprint ${this.name} is ${this.state}`)
                      linked_sprint = this.name
                      console.log(`Linked sprint = ${linked_sprint}`)
                    })
                    console.log(`Linked sprint = ${linked_sprint}`)
                  }

                  console.log(`Link Type: ${link_type} Issue Key: ${linked_issue_key} Status: ${linked_issue_status} Sprint: ${linked_sprint}`)

                  $(linkedIssueNode).append("<span style=\"cursor:pointer;font-size:12px;color: rgb(107, 119, 140);\" data-tooltip=\"" + linked_issue_summary + " - " + linked_sprint + "\"> " + link_type + " " + linked_issue_key + "</span> ");

                  $(linkedIssueNode).append(linkStatus(linked_issue_status));

                  $(wrapper).append(linkedIssueNode);

                })



                    });
                }
            });
        }

function addPRLabels() {
  console.log("Adding PR Labels")


    if ($(".link-status-in-jira-wrapper").length == 0) {

      console.log("link-status-in-jira not found, creating it")
      console.log("Linked Columns " + LINKED_COLUMNS)

        // We don't care to rebuild this list multiple times if we have
        // already determined it once
        if (!JIRA_COLUMNS.length) {
            $.each($("#ghx-column-headers .ghx-column h2"), function () {
                var column_text = $(this).text();
                console.log("Column Text: " + column_text)

                if (LINKED_COLUMNS.indexOf(column_text) !== -1) {
                    console.log("Pushing " + $(this).parent().parent().parent().attr("data-id"))

                    JIRA_COLUMNS.push($(this).parent().parent().parent().attr("data-id"));
                }
            });
        }

        console.log("Jira Columns: " + JIRA_COLUMNS)

        // select the right columns if there are multiple, and search for all cards in those
        // columns afterwards
        var allSelectors = '[id="ghx-backlog-column"] .ghx-issue-compact'

        var columnSelectors = JIRA_COLUMNS.map(function (element) {
            return '[data-column-id="' + element + '"] .ghx-issue';
        }).join(', ');

        if (columnSelectors) {
          allSelectors = allSelectors.concat(`, ${columnSelectors}`)
        }

        console.log("All selectors: " + allSelectors)

        var cards = document.querySelectorAll(allSelectors);

        console.log("Cards: " + cards)


        Array.prototype.forEach.call(cards, function (card) {
            console.log("Populating Card: " + card)
            populateIssueCard(card);
        });


    }
    setTimeout(addPRLabels, 1500);
}

function linkStatus(status) {
    switch (status) {
        case "OPEN":
            return "<span class=\"aui-lozenge aui-lozenge-overflow aui-lozenge-subtle aui-lozenge-complete\" style=\"color:#0052cc !important;border-color:#b3d4ff !important;\">OPEN</span>";
            break;
        case "MERGED":
            return "<span class=\"aui-lozenge aui-lozenge-overflow aui-lozenge-subtle aui-lozenge-success\">MERGED</span>";
            break;
        case "DECLINED":
            return "<span class=\"aui-lozenge aui-lozenge-overflow aui-lozenge-subtle aui-lozenge-error\">DECLINED</span>";
            break;
        default:
            return "<span class=\"aui-lozenge aui-lozenge-overflow aui-lozenge-subtle\">" + status + "</span>";
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
