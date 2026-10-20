from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, PageBreak, ListFlowable

# Use a system Chinese-supporting font.
font_path = '/Library/Fonts/Arial Unicode.ttf'
pdfmetrics.registerFont(TTFont('CJK', font_path))

styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    name='TitleCJK',
    parent=styles['Title'],
    fontName='CJK',
    fontSize=26,
    leading=30,
    alignment=1,
    textColor=HexColor('#0F172A'),
    spaceAfter=10,
))

styles.add(ParagraphStyle(
    name='SubtitleCJK',
    parent=styles['BodyText'],
    fontName='CJK',
    fontSize=12,
    leading=18,
    textColor=HexColor('#334155'),
    alignment=1,
    spaceAfter=18,
))

styles.add(ParagraphStyle(
    name='SectionCJK',
    parent=styles['Heading2'],
    fontName='CJK',
    fontSize=17,
    leading=22,
    textColor=HexColor('#0B2D45'),
    spaceBefore=14,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='BodyCJK',
    parent=styles['BodyText'],
    fontName='CJK',
    fontSize=10.8,
    leading=16,
    textColor=HexColor('#1F2937'),
    spaceAfter=4,
))

styles.add(ParagraphStyle(
    name='HighlightCJK',
    parent=styles['BodyText'],
    fontName='CJK',
    fontSize=11,
    leading=17,
    textColor=HexColor('#0F172A'),
    backColor=HexColor('#E2F0FF'),
    borderPadding=6,
    spaceAfter=8,
))

styles.add(ParagraphStyle(
    name='BulletCJK',
    parent=styles['BodyText'],
    fontName='CJK',
    fontSize=10.5,
    leading=15,
    textColor=HexColor('#1F2937'),
    leftIndent=12,
    bulletIndent=12,
    spaceAfter=3,
))


def make_bullets(items):
    return [Paragraph(f'• {item}', styles['BulletCJK']) for item in items]


def build_story():
    story = []

    story.append(Paragraph('Nuya', styles['TitleCJK']))
    story.append(Paragraph('多租戶餐飲點餐與營運管理模板', styles['SubtitleCJK']))
    story.append(Paragraph('幫餐飲品牌快速開店、提升點餐效率、強化營運管理與顧客體驗', styles['HighlightCJK']))
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph('產品定位', styles['SectionCJK']))
    story.extend(make_bullets([
        'Nuya 是一套專為餐飲店、咖啡店、飲品店與連鎖餐飲品牌設計的完整線上點餐與門市營運系統。',
        '它不只是顧客點餐頁面，而是一整套包含後台管理、菜單設定、訂單處理、營收分析、分店管理與平台管理的數位餐飲解決方案。',
        '對店家而言，Nuya 能讓品牌快速上線、降低營運成本、提升顧客體驗，並支援未來多店擴張。',
    ]))

    story.append(PageBreak())
    story.append(Paragraph('為什麼值得選擇 Nuya？', styles['SectionCJK']))
    story.extend(make_bullets([
        '直接可用：內建顧客點餐、店家後台、訂單管理、品牌設定與營收資料。',
        '支援多店經營：每間店擁有自己的網站與後台，平台集中管理。',
        '真實營運導向：從點餐到出單、製作、完成、追蹤，全流程一體化。',
        '適合實際部署：採用 Next.js、TypeScript、Prisma、PostgreSQL 等成熟技術棧。',
        '提高服務效率：顧客可自助點餐、查詢狀態，店家可更專注於製作與服務。',
    ]))

    story.append(Paragraph('核心功能總覽', styles['SectionCJK']))
    story.extend(make_bullets([
        '多租戶架構：每一家店擁有獨立資料、獨立後台與獨立網址，並由平台統一管理。',
        '自助註冊開店：店家可直接註冊新店，快速建立品牌與分店資訊，並附新店開通導覽清單幫助上手。',
        '菜單管理：建立分類、管理商品、上傳圖片、設定是否上架。',
        '加購與客製選項：支援大小、辣度、甜度、加料與選購限制設定。',
        '訂單管理：可查看新訂單、待處理、已完成、取消訂單與列印廚房單。',
        '廚房顯示看板：大字體、自動變色提醒，適合廚房螢幕即時掌握待處理訂單。',
        '營收與儀表板：查看今日/本月營收、熱門商品、每日趨勢。',
        '店鋪與時間設定：設定營業時間、特殊休息日、分店資訊與營業規則。',
        '分店橫幅照片：每間分店可上傳並裁切專屬門市照片，取代單一品牌色塊。',
        '一鍵複製網址：後台隨時可複製店家專屬點餐網址，方便推廣分享。',
        '雙語支援：繁體中文與 English 自動切換，適合多語環境。',
        '即時更新：新訂單與狀態變更會同步更新，無需手動刷新。',
        '帳號安全：信箱驗證與忘記密碼/重設密碼流程，保障店家帳號。',
        '平台管理：平台方可管理所有租戶，包含啟用、停用與刪除。',
    ]))

    story.append(PageBreak())
    story.append(Paragraph('一、顧客點餐體驗', styles['SectionCJK']))
    story.extend(make_bullets([
        '顧客可選擇分店與用餐方式，快速完成餐點選購。',
        '菜單瀏覽清楚，支援商品觸發項目、選項與條件設定。',
        '加入購物車、調整選項、完成結帳流程簡單直觀。',
        '可追蹤訂單狀態，顧客不需要反覆詢問店員。',
        '對店家來說，能減少大量電話與現場排隊造成的人力負擔。',
    ]))

    story.append(Paragraph('二、店家後台管理', styles['SectionCJK']))
    story.extend(make_bullets([
        '首次登入即有開通導覽清單，引導新店家完成 Logo、菜單、分店等必要設定。',
        '儀表板中可看到今日訂單、營收、月營收趨勢與熱賣商品。',
        '可管理商品類別、菜單價格、商品圖片與上架狀態。',
        '支援分店資訊、營業時間與例外停業日期設定。',
        '訂單狀態清楚明確：待處理、已完成、已取消。',
        '可針對訂單進行標註完成與列印廚房單，提升後場效率。',
        '廚房顯示看板以大字體呈現待處理訂單，超時自動變色提醒，降低漏單風險。',
        '調整品牌色、Logo、店名與分店橫幅照片（可直接裁切），讓每頁都符合品牌風格。',
        '後台頂部可一鍵複製店家專屬網址，方便隨時分享推廣。',
    ]))

    story.append(Paragraph('三、訂單流程與營運效率', styles['SectionCJK']))
    story.extend(make_bullets([
        '新訂單會立即顯示，店家可快速處理。',
        '專為餐飲場景設計，支援內用、外帶、外送等不同類型。',
        '每筆訂單包含完整資訊：顧客資料、購買項目、加購需求、付款方式與備註。',
        '完整歷史紀錄可查詢與篩選，支援訂單編號、電話、日期、狀態等查找。',
        '訂單完成後可進一步優化後續客服與營運報表。',
    ]))

    story.append(PageBreak())
    story.append(Paragraph('四、平台管理能力', styles['SectionCJK']))
    story.extend(make_bullets([
        '平台管理者可搜尋、查看所有店家資料。',
        '可查看每位店主的電子郵件、分店數量、訂單數量與註冊日期。',
        '支援暫停或啟用店家，維持平台安全與健康運營。',
        '能批量維護門市與租戶資料，適合作為 SaaS 平台基底。',
        '擁有更高層級的系統控制與資產管理能力。',
    ]))

    story.append(Paragraph('五、技術與擴展優勢', styles['SectionCJK']))
    story.extend(make_bullets([
        'Next.js 16 + TypeScript：高效、穩定、適合長期維護。',
        'Prisma + PostgreSQL：強大的資料管理與多租戶隔離能力。',
        'Vercel 部署友好：適合快速佈署與擴張。',
        '雙語字典系統：支援繁體中文/英文、提升國際化適應力。',
        '安全設計：每個租戶資料與後台權限皆獨立關聯，並提供信箱驗證與密碼重設流程，降低資安風險。',
        '為後續功能開發保留擴展空間，例如支付串接、會員系統、外送整合。',
    ]))

    story.append(Paragraph('六、適用商業場景', styles['SectionCJK']))
    story.extend(make_bullets([
        '餐飲品牌快速建站與數位轉型。',
        '多店餐飲品牌集中管理與品牌統一。',
        '咖啡、飲品、甜點、小吃、外帶店等受益顯著。',
        '創業者希望建立餐飲 SaaS 平台基底。',
        '需要既有品牌又能維持店鋪營運效率的商家。',
    ]))

    story.append(PageBreak())
    story.append(Paragraph('Nuya 的商業價值', styles['SectionCJK']))
    story.extend(make_bullets([
        '讓店家不用從零開始構建複雜訂餐系統，縮短上線時間。',
        '讓顧客享受更順暢的點餐與訂單追蹤體驗。',
        '讓店家更容易管理菜單、營收與分店營運。',
        '讓平台運營者可集中管理多品牌、多店家資產。',
        '這是一套兼具功能完整性、品牌能力與擴展潛力的餐飲數位解決方案。',
    ]))

    story.append(Paragraph('一句話總結', styles['SectionCJK']))
    story.append(Paragraph('Nuya = 讓餐飲店快速上線自己的線上訂餐系統 + 打造品牌化、智能化、可擴展的多店餐飲營運平台。', styles['HighlightCJK']))
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph('適合：想快速開店、提升顧客點餐體驗、優化店內營運效率、並且具備未來擴張潛力的餐飲業者。', styles['BodyCJK']))

    return story


if __name__ == '__main__':
    output_path = '/Users/yulumeng/Desktop/Nuya_Restaurant/docs/nuya_template_brochure_zh.pdf'
    doc = SimpleDocTemplate(output_path, pagesize=A4, title='Nuya 餐飲點餐模板說明書', author='Nuya')
    doc.build(build_story())
    print(f'PDF generated: {output_path}')
