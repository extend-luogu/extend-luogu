export const emos: Emo[] = [
    { type: 'qq', names: ['kk'], file: '0' },
    { type: 'qq', names: ['jk'], file: '1' },
    { type: 'qq', names: ['se'], file: '2' },
    { type: 'qq', names: ['qq'], file: '3' },
    { type: 'qq', names: ['xyx'], file: '4' },
    { type: 'qq', names: ['xia'], file: '5' },
    { type: 'qq', names: ['cy'], file: '6' },
    { type: 'qq', names: ['ll'], file: '7' },
    { type: 'qq', names: ['xk'], file: '8' },
    { type: 'qq', names: ['qiao'], file: '9' },
    { type: 'qq', names: ['qiang'], file: 'a' },
    { type: 'qq', names: ['ruo'], file: 'b' },
    { type: 'qq', names: ['mg'], file: 'c' },
    { type: 'qq', names: ['dx'], file: 'd' },
    { type: 'qq', names: ['youl'], file: 'e' },
    { type: 'qq', names: ['bj'], file: 'f' },
    { type: 'qq', names: ['shq'], file: 'g' },
    { type: 'qq', names: ['lb'], file: 'h' },
    { type: 'qq', names: ['lh'], file: 'i' },
    { type: 'qq', names: ['qd'], file: 'j' },
    { type: 'qq', names: ['fad'], file: 'k' },
    { type: 'qq', names: ['dao'], file: 'l' },
    { type: 'qq', names: ['cd'], file: 'm' },
    { type: 'qq', names: ['kun'], file: 'n' },
    { type: 'qq', names: ['px'], file: 'o' },
    { type: 'qq', names: ['ts'], file: 'p' },
    { type: 'qq', names: ['kl'], file: 'q' },
    { type: 'qq', names: ['yiw'], file: 'r' },
    { type: 'qq', names: ['dk'], file: 's' },
    { type: 'txt', names: ['sto'], file: 'gg', display: 'sto' },
    { type: 'txt', names: ['orz'], file: 'gh', display: 'orz' },
    { type: 'txt', names: ['qwq'], file: 'g5', display: 'qwq' },
    { type: 'txt', names: ['hqlm'], file: 'l0', display: '火前留名' },
    { type: 'txt', names: ['sqlm'], file: 'l1', display: '山前留名' },
    { type: 'txt', names: ['xbt'], file: 'g1', display: '屑标题' },
    { type: 'txt', names: ['iee'], file: 'g2', display: '我谔谔' },
    { type: 'txt', names: ['kg'], file: 'g3', display: '烤咕' },
    { type: 'txt', names: ['gl'], file: 'g4', display: '盖楼' },
    { type: 'txt', names: ['wyy'], file: 'g6', display: '无意义' },
    { type: 'txt', names: ['wgzs'], file: 'g7', display: '违规紫衫' },
    { type: 'txt', names: ['tt'], file: 'g8', display: '贴贴' },
    { type: 'txt', names: ['jbl'], file: 'g9', display: '举报了' },
    { type: 'txt', names: ['%%%'], file: 'ga', display: '%%%' },
    { type: 'txt', names: ['ngrb'], file: 'gb', display: '你谷日爆' },
    { type: 'txt', names: ['qpzc'], file: 'gc', display: '前排资瓷' },
    { type: 'txt', names: ['cmzz'], file: 'gd', display: '臭名昭著' },
    { type: 'txt', names: ['zyx'], file: 'ge', display: '致远星' },
    { type: 'txt', names: ['zh'], file: 'gf', display: '祝好' }
]

export const size = '!25'

export type Emo = {
    names: string[]
    file: string
} & (
    | {
          type: 'qq'
      }
    | {
          type: 'txt'
          display: string
      }
)
