'use strict'

function displayUtilities() {
  return `/* Display & Visibility */
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.flow-root { display: flow-root; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.inline-grid { display: inline-grid; }
.contents { display: contents; }
.list-item { display: list-item; }
.hidden { display: none; }
.table { display: table; }
.inline-table { display: inline-table; }
.table-caption { display: table-caption; }
.table-cell { display: table-cell; }
.table-column { display: table-column; }
.table-column-group { display: table-column-group; }
.table-footer-group { display: table-footer-group; }
.table-header-group { display: table-header-group; }
.table-row-group { display: table-row-group; }
.table-row { display: table-row; }
.visible { visibility: visible; }
.invisible { visibility: hidden; }
.collapse { visibility: collapse; }
.float-start { float: inline-start; }
.float-end { float: inline-end; }
.float-right { float: right; }
.float-left { float: left; }
.float-none { float: none; }
.clear-start { clear: inline-start; }
.clear-end { clear: inline-end; }
.clear-left { clear: left; }
.clear-right { clear: right; }
.clear-both { clear: both; }
.clear-none { clear: none; }
.box-border { box-sizing: border-box; }
.box-content { box-sizing: content-box; }

`;
}

module.exports = {
  displayUtilities,
};
