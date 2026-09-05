// tiny markdown renderer
// supports: # headings, **bold**, *italic*, `inline code`,
// ```code blocks```, > blockquotes, [links](url), - lists, paragraphs

function renderMarkdown(src) {
  var html = "";
  var lines = src.split("\n");
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    // skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // code block
    if (line.trim().startsWith("```")) {
      var lang = line.trim().slice(3).trim();
      var code = "";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code += escHtml(lines[i]) + "\n";
        i++;
      }
      i++; // skip closing ```
      html += "<pre>" + highlight(code.replace(/\n$/, ""), lang) + "</pre>\n";
      continue;
    }

    // heading
    var hMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (hMatch) {
      var level = hMatch[1].length;
      html += "<h" + level + ">" + inline(hMatch[2]) + "</h" + level + ">\n";
      i++;
      continue;
    }

    // blockquote
    if (line.trim().startsWith("> ")) {
      var bq = "";
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        bq += lines[i].trim().slice(2) + " ";
        i++;
      }
      html += "<blockquote><p>" + inline(bq.trim()) + "</p></blockquote>\n";
      continue;
    }

    // unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      html += "<ul>\n";
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        html +=
          "<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>\n";
        i++;
      }
      html += "</ul>\n";
      continue;
    }

    // table (| ... | rows, second row may be a -- separator)
    if (line.trim().startsWith("|")) {
      var tbl = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tbl.push(lines[i]);
        i++;
      }
      function cells(row) {
        return row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map(function (s) {
            return s.trim();
          });
      }
      html += "<table>\n<thead>\n<tr>\n";
      cells(tbl[0]).forEach(function (c) {
        html += "<th>" + inline(c) + "</th>\n";
      });
      html += "</tr>\n</thead>\n<tbody>\n";
      for (var t = 1; t < tbl.length; t++) {
        var row = tbl[t].trim();
        if (!row.replace(/[|\s:-]/g, "")) {
          continue;
        }
        html += "<tr>\n";
        cells(row).forEach(function (c) {
          html += "<td>" + inline(c) + "</td>\n";
        });
        html += "</tr>\n";
      }
      html += "</tbody>\n</table>\n";
      continue;
    }

    // paragraph (collect consecutive non-empty, non-special lines)
    var para = "";
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("> ") &&
      !lines[i].match(/^\s*[-*]\s+/) &&
      !lines[i].trim().startsWith("|")
    ) {
      para += lines[i] + " ";
      i++;
    }
    html += "<p>" + inline(para.trim()) + "</p>\n";
  }

  return html;
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  s = escHtml(s);
  // images/video ![alt](url) — .mp4/.webm become <video>, rest become <img>
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, url) {
    if (url.match(/\.(mp4|webm)$/i)) {
      return (
        '<video src="' + url + '" autoplay loop muted playsinline></video>'
      );
    }
    return '<img src="' + url + '" alt="' + alt + '" loading="lazy">';
  });
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  // inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

// minimal syntax highlighter
// colors: keywords, strings, comments, numbers, types, functions
function highlight(code, lang) {
  if (!lang || lang === "text" || lang === "plain") {
    return code;
  }

  var keywords, types, commentLine, commentBlock;

  if (lang === "c" || lang === "h") {
    keywords =
      /\b(if|else|for|while|do|return|break|continue|switch|case|default|goto|sizeof|typedef|struct|enum|union|static|const|extern|void|inline|volatile|register)\b/g;
    types =
      /\b(int|float|double|char|long|short|unsigned|signed|size_t|FILE|NULL)\b/g;
    commentLine = /\/\/.*/g;
    commentBlock = /\/\*[\s\S]*?\*\//g;
  } else if (lang === "py" || lang === "python") {
    keywords =
      /\b(if|elif|else|for|while|break|continue|return|def|class|import|from|as|try|except|finally|raise|with|yield|lambda|pass|del|global|nonlocal|assert|and|or|not|in|is)\b/g;
    types =
      /\b(None|True|False|self|int|float|str|list|dict|tuple|set|bool|print|len|range|open|super|type)\b/g;
    commentLine = /#.*/g;
    commentBlock = null;
  } else if (lang === "sh" || lang === "bash" || lang === "shell") {
    keywords =
      /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|local|export|set|unset|shift|break|continue)\b/g;
    types = null;
    commentLine = /#.*/g;
    commentBlock = null;
  } else {
    return code;
  }

  // tokenize to avoid highlighting inside strings/comments
  var tokens = [];
  var remaining = code;

  while (remaining.length > 0) {
    // check for strings
    var strMatch = remaining.match(/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
    if (strMatch) {
      tokens.push('<span class="hl-str">' + strMatch[1] + "</span>");
      remaining = remaining.slice(strMatch[1].length);
      continue;
    }

    // check for line comment
    if (commentLine) {
      var cm = remaining.match(commentLine);
      if (cm && remaining.indexOf(cm[0]) === 0) {
        tokens.push('<span class="hl-com">' + cm[0] + "</span>");
        remaining = remaining.slice(cm[0].length);
        continue;
      }
    }

    // check for block comment
    if (commentBlock) {
      var bm = remaining.match(/^\/\*[\s\S]*?\*\//);
      if (bm) {
        tokens.push('<span class="hl-com">' + bm[0] + "</span>");
        remaining = remaining.slice(bm[0].length);
        continue;
      }
    }

    // check for $ prompt lines (shell)
    if (
      (lang === "sh" || lang === "bash" || lang === "shell" || !lang) &&
      remaining.match(/^\$/)
    ) {
      tokens.push('<span class="hl-com">$</span>');
      remaining = remaining.slice(1);
      continue;
    }

    // grab next word or character
    var wordMatch = remaining.match(/^[a-zA-Z_]\w*/);
    if (wordMatch) {
      var w = wordMatch[0];
      var cls = null;
      if (keywords && w.match(keywords)) {
        cls = "hl-kw";
      } else if (types && w.match(types)) {
        cls = "hl-type";
      }

      // check if followed by ( for function call
      if (!cls && remaining.charAt(w.length) === "(") {
        cls = "hl-fn";
      }

      if (cls) {
        tokens.push('<span class="' + cls + '">' + w + "</span>");
      } else {
        tokens.push(w);
      }
      remaining = remaining.slice(w.length);
      continue;
    }

    // numbers
    var numMatch = remaining.match(/^(0x[0-9a-fA-F]+|[0-9]+\.?[0-9]*f?)\b/);
    if (numMatch) {
      tokens.push('<span class="hl-num">' + numMatch[0] + "</span>");
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // anything else (operators, whitespace, etc)
    tokens.push(remaining.charAt(0));
    remaining = remaining.slice(1);
  }

  return tokens.join("");
}
