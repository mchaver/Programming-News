Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

var currentTab = 'HackerNews';

function parseWebsite(url, dataProcessingFunc, callback) {
  var html = '';
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'html',
    header: {'User-agent':'Programming News Chrome Extension v1.0'},
    success: function(data) {
      html = dataProcessingFunc(data);
      callback(html);
    },
    error : function(xhr, textStatus, errorThrown) {
      html = '<li class"link-list-row">Unable to connect to the website at the moment.</li>';
      callback(html);
    }
  });
}

function scrapeHackerNews(data) {
  var finalHtml = '<ul class="link-list">';
  var subtexts = $(data).find('.subtext');
  $(data).find('tr > td.title > a').each(function(index, title) {
    if (index >= 30) {
      return;
    } else if (title) {
      var newElement = '<li class="link-list-row"><a href="' + $(title).attr('href') + '" class="site-link">' + $(title).text() + '</a>';
      var comments = $(subtexts[index]).children().eq(2);
      if ($(comments).text()) {
        if ($(comments).text() == 'discuss') {
          newElement += '<a href="' + 'http://news.ycombinator.com/' + $(comments).attr('href') + '" class="comments-link">0 comments</a>';
        } else {
          newElement += '<a href="' + 'http://news.ycombinator.com/' + $(comments).attr('href') + '" class="comments-link">' + $(comments).text() + '</a>';
        }
      } else {
        newElement += '<span class="comments-link">No comments</span>';
      }
      newElement += '<span class="add-bookmark">add</span>';
      newElement += '</li>';
      finalHtml += newElement;
    }
  });
  finalHtml += '</ul>';
  return finalHtml;
}

function scrapeReddit(data) {
  var finalHtml = '<ul class="link-list">';
  var comments = $(data).find('#siteTable > div.link > div > ul.buttons li.first > a');
  $(data).find('#siteTable > div.link > div > p.title > a.title').each(function(index, title) {
    if ($(title).text()) {
      var newElement = '<li class="link-list-row"><a href="' + $(title).attr('href') + '" class="site-link">' + $(title).text() + '</a>';
      if ($(comments[index]).text()) {
        if ($(comments[index]).text() == 'comment') {
          newElement += '<a href="' + $(comments[index]).attr('href') + '" class="comments-link">0 comments</a>';
        } else {
          newElement += '<a href="' + $(comments[index]).attr('href') + '" class="comments-link">' + $(comments[index]).text() + '</a>';
        }
      } else {
        newElement += '<a href="#" class="comments-link"></a>';      
      }
      newElement += '<span class="add-bookmark">add</span>';
      newElement += '</li>';
      finalHtml += newElement;
    }
  });
  finalHtml += '</ul>';
  return finalHtml;
}

var hnLastUpdate, redditLastUpdate, now, hackerNewsHtml, redditHtml;
var redditNeedsUpdate, hnNeedsUpdate;

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  var now = new Date();
  if (request.timeSinceUpdate) {
    if (request.site == 'hackernews') {
      if (request.reload || typeof hnLastUpdate === 'undefined' || (((now - hnLastUpdate)/1000/60) >= 10)) {
        hnNeedsUpdate = true;
        hnLastUpdate = new Date();
      } else {
        hnNeedsUpdate = false;
      }
      sendResponse({needsUpdate: hnNeedsUpdate});
    } else if (request.site == 'reddit') {
      if (request.reload || typeof redditLastUpdate === 'undefined' || (((now - redditLastUpdate)/1000/60) >= 10)) {
        redditNeedsUpdate = true;
        redditLastUpdate = new Date();
      } else {
        redditNeedsUpdate = false;
      }
      sendResponse({needsUpdate: redditNeedsUpdate});
    }
  }
  
  return true;
})

//update links
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  now = new Date();
  if (request.tabRequest) {
    if (request.tabRequest == 'hackernews') {
      currentTab = 'HackerNews';
      if (hnNeedsUpdate) {
        parseWebsite('https://news.ycombinator.com/', scrapeHackerNews, function(html) {
          hackerNewsHtml = html;
          sendResponse({html: hackerNewsHtml});
        });
      } else {
        sendResponse({html: hackerNewsHtml});
      }
    } else if (request.tabRequest == 'reddit') {
      currentTab = 'Reddit';
      if (redditNeedsUpdate) {
        parseWebsite('http://www.reddit.com/r/programming', scrapeReddit, function(html) {
          redditHtml = html;
          sendResponse({html: redditHtml});
        });
      } else {
        sendResponse({html: redditHtml});
      }
    }
  }
  return true;
});


function containsBookmark(bookmarks, newBookmark) {
  var index = -1;
  for (var i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].site == newBookmark.site &&
        bookmarks[i].siteLink == newBookmark.siteLink &&
        bookmarks[i].comments == newBookmark.comments &&
        bookmarks[i].commentsLink == newBookmark.commentsLink) {
      index = i;
      break;
    }
  }
  return index;
}
//bookmarks
function addBookmark(data, callback) {
  //chrome.storage.sync.clear();
  chrome.storage.sync.get('programmingNewsLinks', function(bookmarks) {
    if (Object.keys(bookmarks).length === 0) {
      var bookmarks = []
    } else {
      bookmarks = JSON.parse(bookmarks.programmingNewsLinks);
    }
    
    var from = containsBookmark(bookmarks, data);
    var result = "";
    if (from >= 0) {
        bookmarks.move(from, 0);
        result = "moved";
    } else {
        bookmarks.unshift(data);
        if (bookmarks.length > 100) {
          bookmarks.pop();
          result = "addAndPop";
        } else {
          result = "added";
        }
    }
    
    chrome.storage.sync.set({'programmingNewsLinks': JSON.stringify(bookmarks)}, function() {
      callback(result);
    });  
  });
}

function deleteBookmark(index, callback) {
  chrome.storage.sync.get('programmingNewsLinks', function(bookmarks) {
    if (bookmarks.programmingNewsLinks) {
      bookmarks = JSON.parse(bookmarks.programmingNewsLinks);
      bookmarks.splice(index, 1);
      chrome.storage.sync.set({'programmingNewsLinks': JSON.stringify(bookmarks)}, function() {
        callback(true);
      });
    } else {
      callback(false);
    }  
  });
}

function deleteAllBookmarks(callback) {
  chrome.storage.sync.get('programmingNewsLinks', function(bookmarks) {
    if (bookmarks.programmingNewsLinks) {
      bookmarks = JSON.parse(bookmarks.programmingNewsLinks);
      bookmarks = [];
      chrome.storage.sync.set({'programmingNewsLinks': JSON.stringify(bookmarks)}, function() {
        callback(true);
      });
    } else {
      callback(false);
    }  
  });
}

function getBookmarks(callback) {
  chrome.storage.sync.get('programmingNewsLinks', function(bookmarks) {
    var finalHtml = '<ul class="link-list">';
    if (bookmarks.programmingNewsLinks) {
      bookmarks = JSON.parse(bookmarks.programmingNewsLinks);
      bookmarks.forEach(function(bookmark, index) {
        var newElement = '<li class="link-list-row"><a href="' + bookmark.siteLink + '" class="site-link">' + bookmark.site + '</a>';
        newElement += '<a href="' + bookmark.commentsLink + '" class="comments-link">' + bookmark.comments + '</a>';
        newElement += '<span class="delete-bookmark" data-index="' + index + '">delete</span></li>';
        finalHtml += newElement;
      });
    }
    finalHtml += '<li class="link-list-row"><span id="delete-all-bookmarks">Delete all items</span></ul>';
    callback(finalHtml);
  });
}


chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.bookmarkAction) {
    if (request.bookmarkAction == 'addBookmark') {
       addBookmark(request.bookmark, function(result) {
         sendResponse({result: result});
       });
    } else if (request.bookmarkAction == 'deleteBookmark') {
      deleteBookmark(request.index, function(deleted) {
         sendResponse({deleted: deleted});
      });
    } else if (request.bookmarkAction == 'deleteAllBookmarks') {
      deleteAllBookmarks(function(deletedAll) {
         sendResponse({deletedAll: deletedAll});
      });
    } else if (request.bookmarkAction == 'getBookmarks') {
      getBookmarks(function(html) {
         sendResponse({html: html});
      });
      currentTab = 'ReadingList';
    }
  }
  return true;
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.requestTab) {
    sendResponse({currentTab: currentTab});
  }
  return true;
});

