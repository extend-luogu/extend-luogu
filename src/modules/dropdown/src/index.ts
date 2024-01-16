import '@exlg/core/types/module-entry'

utils.addHookSelector('.user-nav' /* "nav.user-nav, div.user-nav > nav, .nav-container" */, ({ hookedNodes }) => {
    const user = utils.luoguUser
    $(hookedNodes[0]).find('.dropdown > .center').children('.header')
        .after(`
        <div style="margin-top: 0.4em;">
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${user.uid}#following.following">
                <span class="value">${user.followingCount}</span>
                <span data-v-3c4577b8="" class="key">关注</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${user.uid}#following.follower">
                <span class="value">${user.followerCount}</span>
                <span data-v-3c4577b8="" class="key">粉丝</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/notification">
                <span class="value">${user.unreadNoticeCount + user.unreadMessageCount}</span>
                <span data-v-3c4577b8="" class="key">动态</span>
            </a>
        </div>
        `)
        .after(`
        <div class="exlg-dropdown field">
            <span data-v-3c4577b8="" class="key-small">CCF 评级: <strong>${user.ccfLevel}</strong> | 咕值排行: <strong>${user.ranking}</strong></span>
        </div>
        `)
})
