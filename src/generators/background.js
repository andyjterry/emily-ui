'use strict'

function backgroundUtilities() {
  return `/* Background */
.bg-fixed { background-attachment: fixed; }
.bg-local { background-attachment: local; }
.bg-scroll { background-attachment: scroll; }
.bg-clip-border { background-clip: border-box; }
.bg-clip-padding { background-clip: padding-box; }
.bg-clip-content { background-clip: content-box; }
.bg-clip-text { -webkit-background-clip: text; background-clip: text; }
.bg-repeat { background-repeat: repeat; }
.bg-no-repeat { background-repeat: no-repeat; }
.bg-repeat-x { background-repeat: repeat-x; }
.bg-repeat-y { background-repeat: repeat-y; }
.bg-repeat-round { background-repeat: round; }
.bg-repeat-space { background-repeat: space; }
.bg-auto { background-size: auto; }
.bg-cover { background-size: cover; }
.bg-contain { background-size: contain; }
.bg-center { background-position: center; }
.bg-top { background-position: top; }
.bg-bottom { background-position: bottom; }
.bg-left { background-position: left; }
.bg-right { background-position: right; }
.bg-left-top { background-position: left top; }
.bg-left-bottom { background-position: left bottom; }
.bg-right-top { background-position: right top; }
.bg-right-bottom { background-position: right bottom; }

`;
}

module.exports = {
  backgroundUtilities,
};
