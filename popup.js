var bkg = chrome.extension.getBackgroundPage();
var current = 'HackerNews';

function reloadTab() {
  chrome.extension.sendMessage({requestTab: true} , function(response) {
    if (response.currentTab == 'HackerNews') {
      getHackerNews();
    } else if (response.currentTab == 'Reddit') {
      getReddit();
    } else if (response.currentTab == 'ReadingList') {
      getBookmarks();
    }
  });
}

function setShortMessage(message) {
  $('#messagebox').text(message);
  $('#messagebox').finish().show().fadeOut(4500);
}

function getHackerNews(reload) {
  chrome.extension.sendMessage({timeSinceUpdate: true, site: 'hackernews', reload: reload} , function(response) {
    if (response.needsUpdate) {
      $('#messagebox').finish().show().text('Loading Hacker News...');
    }
    chrome.extension.sendMessage({tabRequest: 'hackernews'}, function(response) {
      $('#messagebox').hide()
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
      $('#tab-title').text('Hacker News');
      current = 'HackerNews';
    });
  });
}

function getReddit(reload) {
  chrome.extension.sendMessage({timeSinceUpdate: true, site: 'reddit', reload: reload} , function(response) {
    if (response.needsUpdate) {
      $('#messagebox').finish().show().text('Loading Reddit Programming News...');
    }
    chrome.extension.sendMessage({tabRequest: 'reddit'}, function(response) {
      $('#messagebox').hide()
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
    
      $('#reddit-column a').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
      $('#reddit-column .add-bookmark').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
      $('#reddit-column .add-bookmark').click(addBookmark);
      $('#tab-title').text('r/programming');
      current = 'Reddit';
    });
  });
}

function reload() {
  if (current == 'HackerNews') {
    getHackerNews(true);
  } else if (current == 'Reddit') {
    getReddit(true);
  }
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
    $('#bookmarks-column .delete-bookmark').hover(function(){$(this).addClass('highlight-link');}, function(){$(this).removeClass('highlight-link');});
    $('#delete-all-bookmarks').click(showDeleteAllBookmarks);
    $('#tab-title').text('Reading List');
    current = 'ReadingList';
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
    //need the bookmark name
    if (response.result == 'added') {
      setShortMessage('"' + bookmark.site + '" has been added to your reading list.');
    } else if (response.result == 'moved') {
      setShortMessage('"' + bookmark.site + '" is already in your reading list. It has been moved to the top.');
    } else if (response.result == 'addAndPop') {
      setShortMessage('Your reading list is larger than 100 items. "' + bookmark.site + '"has been added and the last item removed.');
    }
  });
}

function deleteBookmark() {
  var site = $(this).siblings().eq(0).text();
  chrome.extension.sendMessage({bookmarkAction : 'deleteBookmark', index: $(this).attr('data-index')}, function(response) {
    if (response.deleted) {
      getBookmarks();
      setShortMessage('"' + site + '" has been removed from your reading list.');
    }
  });
}

function deleteAllBookmarks() {
  chrome.extension.sendMessage({bookmarkAction : 'deleteAllBookmarks'}, function(response) {
    $('#okbox').hide();
    if (response.deletedAll) {
      getBookmarks();
      setShortMessage('All items in your reading list have been removed.');
    }   
  });
}

function showDeleteAllBookmarks() {
  $('#okbox').show();
}

$('#okbox-cancel').click(function(){$('#okbox').hide();});
$('#okbox-delete-all').click(deleteAllBookmarks);

reloadTab();
$('#hacker-news-logo').click(function(){getHackerNews(false);});
$('#reddit-logo').click(function(){getReddit(false);});
$('#reading-list-logo').click(getBookmarks);
$('#reload-icon').click(reload);

$('#hacker-news-logo').hover(function(e) {
  $('#cursor-popup').css({
        'top' : 50,
        'left' : 10
    });
  $('#cursor-popup').show().text('Hacker News');
}, function(e) {
  $('#cursor-popup').hide();
});

$('#reddit-logo').hover(function(e) {
  $('#cursor-popup').css({
        'top' : 50,
        'left' : 50
    });
  $('#cursor-popup').show().text('/r/programming');
}, function(e) {
  $('#cursor-popup').hide();
});

$('#reload-icon').hover(function(e) { $('#cursor-popup').css({'top' : 50,'left' : 355}); $('#cursor-popup').show().text('Reload');}, function(e) { $('#cursor-popup').hide();});

$('#reading-list-logo').hover(function(e) {
  $('#cursor-popup').css({
        'top' : 50,
        'left' : 330
    });
  $('#cursor-popup').show().text('Reading List');
}, function(e) {
  $('#cursor-popup').hide();
});