function decodeBase64(b64) {
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function loadProject(owner, repo) {
  var api = "https://api.github.com/repos/" + owner + "/" + repo;
  var raw =
    "https://raw.githubusercontent.com/" + owner + "/" + repo + "/HEAD/";

  fetch(api)
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (d.message) {
        return;
      }
      var name = d.name || repo;
      var h1 = document.getElementById("proj-name");
      if (h1) {
        h1.textContent = name;
      }
      var desc = document.getElementById("proj-desc");
      if (desc && d.description) {
        desc.textContent = d.description;
      }

      var meta = document.getElementById("proj-meta");
      var parts = [];
      if (d.stargazers_count === 1) {
        parts.push("1 star");
      } else if (d.stargazers_count > 1) {
        parts.push(d.stargazers_count + " stars");
      }
      if (d.forks_count === 1) {
        parts.push("1 fork");
      } else if (d.forks_count > 1) {
        parts.push(d.forks_count + " forks");
      }
      if (d.language) {
        parts.push(d.language);
      }
      if (meta) {
        meta.textContent = parts.join(" / ");
      }

      var link = document.getElementById("proj-link");
      if (link && d.html_url) {
        link.href = d.html_url;
      }
    })
    .catch(function () {});

  fetch(api + "/readme")
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      if (!d.content) {
        return;
      }
      var md = decodeBase64(d.content);
      md = md.replace(
        /!\[([^\]]*)\]\((?!https?:\/\/)([^)#]+)(#[^)]*)?\)/g,
        function (_, alt, url, hash) {
          return "![" + alt + "](" + raw + url + (hash || "") + ")";
        }
      );
      var el = document.getElementById("readme");
      if (el) {
        el.innerHTML = renderMarkdown(md);
      }
    })
    .catch(function () {});
}
