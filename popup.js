var bkg = chrome.extension.getBackgroundPage();

function setShortMessage(message) {
  $('#messagebox').removeClass('hide-messagebox');
  $('#messagebox').text(message);
  $('#messagebox').fadeOut(2500, function () {
    $('#messagebox').show();
    $('#messagebox').addClass('hide-messagebox');
  });
}

function getHackerNews() {
  chrome.extension.sendMessage({timeSinceUpdate: true, site: 'hackernews'} , function(response) {
    if (response.needsUpdate) {
      $('#messagebox').removeClass('hide-messagebox')
      $('#messagebox').text('Loading...')
    }
    chrome.extension.sendMessage({tabRequest: "hackernews"}, function(response) {
      $('#messagebox').addClass('hide-messagebox')
      $('ul').addClass('hide-list');
      $('#hacker-news-column').removeClass('hide-list');
      $('#hacker-news-column').html(response.html);
      $('#hacker-news-column > ul > li > a.site-link').each(function(index, link) {
        $(link).siblings().each(function(index, sibling) {
          $(sibling).height($(link).height());
        });
      });
      $('#hacker-news-column a').click(function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
      });
    
      $('#hacker-news-column a').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
      $('#hacker-news-column .add-bookmark').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
      $('#hacker-news-column .add-bookmark').click(addBookmark);
    });
  });
}

function getReddit() {
  chrome.extension.sendMessage({timeSinceUpdate: true, site: 'reddit'} , function(response) {
    bkg.console.log(response)
    if (response.needsUpdate) {
      $('#messagebox').removeClass('hide-messagebox')
      $('#messagebox').text('Loading...')
    }
    chrome.extension.sendMessage({tabRequest: "reddit"}, function(response) {
      $('#messagebox').addClass('hide-messagebox')
      $('ul').addClass('hide-list');
      $('#reddit-column').removeClass('hide-list');
      $('#reddit-column').html(response.html);
      $('#reddit-column > ul > li > a.site-link').each(function(index, link) {
        $(link).siblings().each(function(index, sibling) {
          $(sibling).height($(link).height());
        });
      });
      $('#reddit-column a').click(function(){
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
      });
    
      $('#reddit-column a').hover(function(){$(this).addClass('highlight-reddit-link');}, function(){$(this).removeClass('highlight-reddit-link');});
      $('#reddit-column .add-bookmark').hover(function(){$(this).addClass('highlight-reddit-link');}, function(){$(this).removeClass('highlight-reddit-link');});
      $('#reddit-column .add-bookmark').click(addBookmark); 
    });
  });
}

function getBookmarks() {
  chrome.extension.sendMessage({bookmarkAction : 'getBookmarks'}, function(response) {
    $('ul').addClass('hide-list');
    $('#bookmarks-column').removeClass('hide-list');  
    $('#bookmarks-column').html(response.html);
    $('#bookmarks-column > ul > li > a.site-link').each(function(index, link) {
      $(link).siblings().each(function(index, sibling) {
        $(sibling).height($(link).height());
      });
    });
    $('#bookmarks-column a').click(function(){
      chrome.tabs.create({url: $(this).attr('href')});
      return false;
    });
    
    $('#bookmarks-column a').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
    $('#bookmarks-column .delete-bookmark').click(deleteBookmark);
    $('#bookmarks-column .delete-all-bookmarks').click(deleteAllBookmarks);
  });
}

function addBookmark() {
  var bookmark = {
    'site' : $(this).siblings().eq(0).text(),
    'siteLink' : $(this).siblings().eq(0).attr('href'),
    'comments' : $(this).siblings().eq(1).text(),
    'commentsLink' : $(this).siblings().eq(1).attr('href')
  }
  
  chrome.extension.sendMessage({bookmarkAction : 'addBookmark', bookmark: bookmark}, function(response) {
    setShortMessage("A bookmark has been added.");
  });
}

function deleteBookmark() {
  chrome.extension.sendMessage({bookmarkAction : 'deleteBookmark', index: $(this).attr('data-index')}, function(response) {
    if (response.deleted) {
      getBookmarks();
      setShortMessage("A bookmark has been deleted.");
    }
  });
}

function deleteAllBookmarks() {
  chrome.extension.sendMessage({bookmarkAction : 'deleteAllBookmarks'}, function(response) {
    if (response.deletedAll) {
      getBookmarks();
      setShortMessage("All bookmarks have been deleted.");
    }
  });
}

getHackerNews();
$('#hacker-news-logo').click(getHackerNews);
$('#reddit-logo').click(getReddit);
$('#disk-logo').click(getBookmarks);
