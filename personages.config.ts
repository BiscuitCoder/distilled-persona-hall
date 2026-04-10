import type { PersonageConfig } from '@/types'

export const personagesConfig: PersonageConfig[] = [
  {
    slug: 'paul-graham',
    dir: 'paul-graham-skill',
    name: 'Paul Graham',
    description: 'YC 创始人，创业与写作思想家',
    avatar: '/avatars/paul-graham.jpg',
    tags: ['创业', '写作', '投资人', '美国', '科技'],
  },
  {
    slug: 'steve-jobs',
    dir: 'steve-jobs-skill',
    name: 'Steve Jobs',
    description: '苹果创始人，产品与设计哲学家',
    avatar: '/avatars/steve-jobs.jpg',
    tags: ['产品', '设计', '科技', '美国'],
  },
  {
    slug: 'trump',
    dir: 'trump-skill',
    name: 'Donald Trump',
    description: '美国前总统，谈判与品牌大师',
    avatar: '/avatars/trump.jpg',
    tags: ['政治', '美国', '商业', '谈判'],
  },
]
