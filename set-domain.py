#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
set-domain.py — يضبط نطاق الموقع على كل الملفات بأمر واحد.

الاستخدام:
    python3 set-domain.py https://alemtiaz.pages.dev

ما الذي يغيّره؟
  • sitemap.xml        : كل روابط YOUR-DOMAIN
  • robots.txt         : سطر Sitemap
  • كل صفحات *.html    : <link rel="canonical"> و <meta property="og:url">
                         وتصحيح og:image ليصبح رابطاً مطلقاً
بعد التشغيل يمكنك حذف هذا الملف قبل الرفع (اختياري).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PLACEHOLDER = 'https://YOUR-DOMAIN'
PAGES = [
    'index.html', 'about.html', 'services.html', 'service.html', 'booking.html',
    'articles.html', 'article.html', 'contact.html', '404.html',
    'login.html', 'admin.html',
]


def normalize(domain: str) -> str:
    domain = domain.strip().rstrip('/')
    if not domain.startswith(('http://', 'https://')):
        domain = 'https://' + domain
    return domain


def page_url(domain: str, filename: str) -> str:
    return domain + '/' if filename == 'index.html' else f'{domain}/{filename}'


def update_sitemap(domain: str) -> bool:
    path = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.exists(path):
        return False
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    content = content.replace(PLACEHOLDER, domain)
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(content)
    return True


def base_path(domain: str) -> str:
    """المسار الأساسي بعد الدومين، مثال: https://user.github.io/repo → /repo"""
    without_scheme = re.sub(r'^https?://', '', domain)
    slash = without_scheme.find('/')
    return without_scheme[slash:] if slash != -1 else ''


def update_robots(domain: str) -> bool:
    path = os.path.join(ROOT, 'robots.txt')
    if not os.path.exists(path):
        return False

    base = base_path(domain)

    with open(path, encoding='utf-8') as fh:
        lines = fh.read().splitlines()

    # إعادة بناء الملف: قواعد الزحف بالمسار الصحيح + سطر خريطة الموقع
    out = [
        'User-agent: *',
        'Allow: /',
        f'Disallow: {base}/admin.html',
        f'Disallow: {base}/login.html',
        '',
        f'Sitemap: {domain}/sitemap.xml',
    ]

    with open(path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(out) + '\n')
    return True


def update_page(domain: str, filename: str) -> bool:
    path = os.path.join(ROOT, filename)
    if not os.path.exists(path):
        return False

    with open(path, encoding='utf-8') as fh:
        html = fh.read()
    original = html

    target = page_url(domain, filename)

    # canonical
    if 'rel="canonical"' in html:
        html = re.sub(
            r'(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")',
            lambda m: m.group(1) + target + m.group(2),
            html, count=1,
        )
    else:
        html = html.replace('</head>', f'<link rel="canonical" href="{target}">\n</head>', 1)

    # og:url
    if 'property="og:url"' in html:
        html = re.sub(
            r'(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")',
            lambda m: m.group(1) + target + m.group(2),
            html, count=1,
        )
    else:
        html = html.replace('</head>', f'<meta property="og:url" content="{target}">\n</head>', 1)

    # og:image → رابط مطلق
    html = re.sub(
        r'(<meta[^>]*property="og:image"[^>]*content=")(?!https?:)([^"]*)(")',
        lambda m: m.group(1) + domain + '/' + m.group(2).lstrip('./') + m.group(3),
        html, count=1,
    )

    if html != original:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(html)
        return True
    return False


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    domain = normalize(sys.argv[1])
    print(f'النطاق المستخدم: {domain}\n')

    changed = []
    if update_sitemap(domain):
        changed.append('sitemap.xml')
    if update_robots(domain):
        changed.append('robots.txt')
    for page in PAGES:
        if update_page(domain, page):
            changed.append(page)

    print('تم التحديث في:')
    for name in changed:
        print('  •', name)
    print('\nخطوة أخيرة: أضف هذا النطاق في Firebase → Authentication → Settings → Authorized domains')
    return 0


if __name__ == '__main__':
    sys.exit(main())
