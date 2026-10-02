#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
content/esg.json 을 읽어 environment.html 의 ESG 표 블록을 생성한다.

매년 갱신 절차
--------------
1. content/esg.json 의 연도별 수치를 갱신한다 (원천: 환경배출·자원관리 워크북).
2. py -3 tools/build_esg.py
3. 변경된 environment.html 을 커밋한다.

표는 항상 "최근 3개년 + 목표 + 목표 대비"로 열 수가 고정되어 해가 바뀌어도 열이 늘지 않는다.
결과물이 정적 HTML 이므로 자바스크립트 없이 검색엔진·스크린리더에 그대로 노출된다.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "content", "esg.json")
PAGE = os.path.join(ROOT, "environment.html")

IND = " " * 10          # environment.html 본문 들여쓰기
TARGET_CUT = 0.97       # 감축 목표: 전년 대비 3% 감소
TARGET_UP = 1.03        # 증가 목표: 전년 대비 3% 증가


# --------------------------------------------------------------------------- 포맷 헬퍼
def fmt(v, nd=2, comma=True):
    if v is None:
        return "&minus;"
    if isinstance(v, str):
        return v
    s = ("%,.{}f".replace("{}", str(nd)) % v) if comma else ("%.{}f".replace("{}", str(nd)) % v)
    return s


def n(v, nd=2, comma=True):
    """숫자 셀 텍스트."""
    if v is None:
        return "&minus;"
    if isinstance(v, str):
        return v
    if comma:
        return format(round(v, nd), ",.%df" % nd)
    return format(round(v, nd), ".%df" % nd)


def pct(v, nd=2):
    return "&minus;" if v is None else "%s%%" % format(round(v * 100, nd), ".%df" % nd)


def vs_target(value, target, higher_is_better=False):
    """목표 대비 셀 HTML. 감축 지표는 목표보다 낮을수록, 증가 지표는 높을수록 좋다."""
    if value is None or target in (None, 0):
        return '<td class="num flat">&minus;</td>'
    if higher_is_better:
        r = (value - target) / target * 100
        good = r >= 0
    else:
        r = (target - value) / target * 100
        good = r >= 0
    arrow = "&#9650;" if (higher_is_better and good) or (not higher_is_better and not good) else "&#9660;"
    cls = "good" if good else "bad"
    return '<td class="num %s">%s %s</td>' % (cls, arrow, format(abs(r), ".2f"))


def target_of(series, base_year, higher_is_better=False):
    b = series.get(str(base_year))
    if b is None:
        return None
    return b * (TARGET_UP if higher_is_better else TARGET_CUT)


# --------------------------------------------------------------------------- 표 뼈대
def wrapper(title, code, inner, note=None, wide=False):
    out = ['%s<div class="table-wrapper">' % IND,
           '%s  <div class="table-header"><span class="table-title">%s</span>%s</div>'
           % (IND, title, '<span class="code">%s</span>' % code if code else ""),
           '%s  <div class="table-scroll">' % IND]
    out.append(inner)
    out.append('%s  </div>' % IND)
    if note:
        out.append('%s  <p class="table-note">%s</p>' % (IND, note))
    out.append('%s</div>' % IND)
    return "\n".join(out)


def row(cells, cls=""):
    return '%s      <tr%s>%s</tr>' % (IND, ' class="%s"' % cls if cls else "", "".join(cells))


# --------------------------------------------------------------------------- 블록 생성기
def block_energy(d):
    e = d["energy_billed"]
    ys = ["2022", "2023", "2024", "2025"]
    head = "".join('<th class="num">%s</th>' % y for y in ys)
    rows = [
        row(['<td class="label-col">총 에너지 소비량 (기가줄)</td>']
            + ['<td class="num">%s</td>' % format(e["values"][y], ",d") for y in ys]),
        row(['<td class="label-col">외부 조달 에너지 소비량 비율</td>']
            + ['<td class="num">100%</td>'] * 4),
        row(['<td class="label-col">재생에너지 소비량 비율</td>'] + ['<td class="num">0%</td>'] * 4),
    ]
    tbl = ('%s    <table class="data-table">\n%s      <thead>\n%s        <tr><th>구분</th>%s</tr>\n'
           '%s      </thead>\n%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, head, IND, IND, "\n".join(rows), IND, IND))
    return wrapper("총 에너지 소비 실적", "TR-AP-130a.1", tbl, e["note"])


def block_ghg(d):
    g, en = d["ghg"], d["energy_inventory"]
    ys = ["2019", "2023", "2024", "2025"]
    head = ('<th class="num">2019<br><span style="font-weight:400; font-size:0.85em;">(기준년도)</span></th>'
            + "".join('<th class="num">%s</th>' % y for y in ys[1:]))

    def cells(s, nd=1):
        return ['<td class="num">%s</td>' % n(s.get(y), nd) for y in ys]

    def reduction(s):
        base = s.get("2019")
        out = ['<td class="num">&minus;</td>']
        for y in ys[1:]:
            v = s.get(y)
            if v is None or not base:
                out.append('<td class="num flat">&minus;</td>')
                continue
            r = (v - base) / base * 100
            out.append('<td class="num %s">%s %s%%</td>'
                       % ("bad" if r > 0 else "good", "&#9650;" if r > 0 else "&#9660;",
                          format(abs(r), ".2f")))
        return out

    rows = [
        row(['<td class="row-group" rowspan="7"><strong>온실가스<br>배출량</strong><br>'
             '<span style="font-weight:400; font-size:0.85em;">tCO&#8322;e</span></td>',
             '<td class="label-col">Scope 1 &middot; 하남</td>'] + cells(g["scope1_hanam"]), "group-start"),
        row(['<td class="label-col">Scope 1 &middot; 함평</td>'] + cells(g["scope1_hampyeong"])),
        row(['<td class="label-col">Scope 2 &middot; 하남</td>'] + cells(g["scope2_hanam"])),
        row(['<td class="label-col">Scope 2 &middot; 함평</td>'] + cells(g["scope2_hampyeong"])),
        row(['<td class="label-col"><strong>계</strong></td>']
            + ['<td class="num"><strong>%s</strong></td>' % n(g["total"].get(y), 1) for y in ys], "row-subtotal"),
        row(['<td class="label-col">기준년 대비 증감</td>'] + reduction(g["total"])),
        row(['<td class="label-col accent-text"><strong>배출 집약도</strong><br>'
             '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted); white-space:nowrap;">'
             'tCO&#8322;e / 매출액 億</span></td>']
            + ['<td class="num accent">%s</td>' % n(g["intensity"].get(y), 3, False) for y in ys], "row-intensity"),
        row(['<td class="row-group" rowspan="5"><strong>에너지<br>사용량</strong><br>'
             '<span style="font-weight:400; font-size:0.85em;">TJ</span></td>',
             '<td class="label-col">하남</td>'] + cells(en["hanam"]), "group-start"),
        row(['<td class="label-col">함평</td>'] + cells(en["hampyeong"])),
        row(['<td class="label-col"><strong>계</strong></td>']
            + ['<td class="num"><strong>%s</strong></td>' % n(en["total"].get(y), 1) for y in ys], "row-subtotal"),
        row(['<td class="label-col">기준년 대비 증감</td>'] + reduction(en["total"])),
        row(['<td class="label-col accent-text"><strong>사용 집약도</strong><br>'
             '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted); white-space:nowrap;">'
             'TJ / 매출액 億</span></td>']
            + ['<td class="num accent">%s</td>' % n(en["intensity"].get(y), 4, False) for y in ys], "row-intensity"),
    ]
    tbl = ('%s    <table class="data-table data-table-grouped">\n%s      <thead>\n'
           '%s        <tr><th colspan="2">구분</th>%s</tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, head, IND, IND, "\n".join(rows), IND, IND))
    note = ("온실가스 배출권 명세서 기준 &middot; 측정 빈도 연 1회. 총량은 함평공장 신규 가동과 생산 증가로 "
            "기준년도 대비 늘었으나, 매출액 기준 집약도는 온실가스 41.4%, 에너지 14.0% 개선되었습니다. "
            "위 에너지 사용량은 명세서 기준으로, 요금 실적 기준인 &lsquo;총 에너지 소비 실적&rsquo; 표와 "
            "산출 근거가 달라 수치에 차이가 있습니다.")
    return wrapper("온실가스 배출량 &middot; 에너지 사용량", "FY 2019 ~ 2025", tbl, note)


def block_air(d):
    a, rev = d["air"], d["revenue"]["values"]
    ys = ["2023", "2024", "2025"]
    head1 = ('<th rowspan="2" style="vertical-align:middle;">물질</th>'
             '<th colspan="3" class="num group-head">배출량 (ton/yr)</th>'
             '<th colspan="3" class="num group-head">원단위 (kg/yr&middot;매출액 億)</th>'
             '<th rowspan="2" class="num" style="vertical-align:middle;">목표 대비 (%)</th>'
             '<th rowspan="2" style="vertical-align:middle;">비고</th>')
    head2 = ("".join("<th class=\"num\">'%s</th>" % y[2:] for y in ys)
             + '<th class="num">\'24</th>'
             '<th class="num">목표<br><span style="font-weight:400; font-size:0.85em;">(3% 감소)</span></th>'
             '<th class="num">\'25</th>')

    STATUS = {"목표 달성": "met", "목표 초과": "over", "소폭 초과": "watch",
              "신규 검출": "new", "신규 항목": "new", "THC 증가 영향": "over",
              "총량 목표 달성": "met"}

    def line(it, cls=""):
        c = ['<td class="label-col">%s</td>' % it["name"]] if not cls else \
            ['<td class="label-col"><strong>%s</strong></td>' % it["name"]]
        c += ['<td class="num">%s</td>' % n(it["emission"].get(y), 3, False) for y in ys]
        for k, nd in (("intensity_2024", 3), ("target", 3), ("intensity_2025", 3)):
            c.append('<td class="num">%s</td>' % n(it[k], nd, False))
        v = it["vs_target"]
        if v is None:
            c.append('<td class="num flat">&minus;</td>')
        else:
            r = v * 100
            c.append('<td class="num %s">%s %s</td>'
                     % ("bad" if r > 0 else "good", "&#9650;" if r > 0 else "&#9660;",
                        format(abs(r), ".2f")))
        note = it.get("note") or "-"
        c.append('<td>%s</td>' % ('<span class="status %s">%s</span>' % (STATUS[note], note)
                                  if note in STATUS else "&minus;"))
        return row(c, cls)

    rows = [line(it) for it in a["items"]] + [line(a["total"], "row-total")]
    tbl = ('%s    <table class="data-table data-table-grouped data-table-wide">\n%s      <thead>\n'
           '%s        <tr>%s</tr>\n%s        <tr>%s</tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, head1, IND, head2, IND, IND, "\n".join(rows), IND, IND))
    note = ("원단위는 매출액 1억원당 환산값(kg/yr&middot;億)입니다. &lsquo;목표 대비&rsquo;는 2025년 원단위를 "
            "목표치(2024년 원단위의 3% 감소)와 비교한 값으로 &#9660;는 목표 달성, &#9650;는 목표 초과를 뜻합니다. "
            "황산화물은 2023&middot;2024년 미검출 후 2025년 재검출되었고, 아세트알데히드는 2025년 신규 측정 항목입니다.")

    return wrapper("대기오염물질 배출량", "FY 2023 ~ 2025", tbl, note)


def block_water(d):
    w = d["water"]
    ys = ["2019", "2023", "2024", "2025"]
    head = ('<th class="num">2019<br><span style="font-weight:400; font-size:0.85em;">(기준년도)</span></th>'
            + "".join('<th class="num">%s</th>' % y for y in ys[1:]))

    def reduction(s, nd=2):
        base = s.get("2019")
        out = ['<td class="num">&minus;</td>']
        for y in ys[1:]:
            v = s.get(y)
            r = (v - base) / base * 100
            out.append('<td class="num %s">%s %s%%</td>'
                       % ("bad" if r > 0 else "good", "&#9650;" if r > 0 else "&#9660;",
                          format(abs(r), ".2f")))
        return out

    rows = [
        row(['<td class="label-col">용수 사용량 (ton)</td>']
            + ['<td class="num">%s</td>' % n(w["use_ton"].get(y), 0) for y in ys]),
        row(['<td class="label-col">총량 감축률 <span style="font-weight:400; font-size:0.85em; '
             'color:var(--text-muted);">(2019년 대비)</span></td>'] + reduction(w["use_ton"])),
        row(['<td class="label-col accent-text"><strong>사용 원단위</strong><br>'
             '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted); white-space:nowrap;">'
             'ton / 매출액 億</span></td>']
            + ['<td class="num accent">%s</td>' % n(w["intensity"].get(y), 2, False) for y in ys], "row-intensity"),
        row(['<td class="label-col">원단위 감축률 <span style="font-weight:400; font-size:0.85em; '
             'color:var(--text-muted);">(2019년 대비)</span></td>'] + reduction(w["intensity"])),
        row(['<td class="label-col"><strong>폐수 위탁처리량 (ton)</strong></td>']
            + ['<td class="num">%s</td>' % n(w["wastewater_ton"].get(y), 2) for y in ys], "row-total"),
    ]
    tbl = ('%s    <table class="data-table data-table-grouped">\n%s      <thead>\n'
           '%s        <tr><th>구분</th>%s</tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, head, IND, IND, "\n".join(rows), IND, IND))
    note = "용수 사용량 관리 주기 연 1회. 폐수는 5종 전량 위탁 처리하며 사업장 내 방류는 없습니다."
    return wrapper("용수 사용량 &middot; 폐수 위탁처리량", "FY 2019 ~ 2025", tbl, note)


def _three_year_head():
    return ('<th class="num">2023</th><th class="num">2024</th>'
            '<th class="num">목표<br><span style="font-weight:400; font-size:0.85em;">(3% 감소)</span></th>'
            '<th class="num">2025</th><th class="num">목표 대비</th>')


def block_waste(d):
    r = d["resources"]
    ys = ["2023", "2024", "2025"]

    def _wrap(txt, strong):
        return "<strong>%s</strong>" % txt if strong else txt

    def cells(key, nd=2, comma=True, strong=False, accent=False):
        s = r[key]["values"]
        vals = [s.get(ys[0]), s.get(ys[1]), target_of(s, 2024), s.get(ys[2])]
        return ['<td class="num%s">%s</td>'
                % (" accent" if accent else "", _wrap(n(v, nd, comma), strong))
                for v in vals]

    def grp(label, keys, span_target_key):
        out = []
        for i, (key, lbl) in enumerate(keys):
            c = []
            if i == 0:
                c.append('<td class="row-group" rowspan="%d"><strong>폐기물<br>발생량</strong><br>'
                         '<span style="font-weight:400; font-size:0.85em;">%s</span></td>' % (len(keys), label))
            cls = ""
            if key.endswith("_total"):
                cls = "row-subtotal"
            elif key.endswith("_intensity"):
                cls = "row-intensity"
            if cls == "row-intensity":
                c.append('<td class="label-col accent-text"><strong style="white-space:nowrap;">'
                         'ton / 매출액 億</strong></td>')
                c += cells(key, 3, False, accent=True)
            else:
                c.append('<td class="label-col">%s</td>' %
                         ("<strong>계</strong>" if cls == "row-subtotal" else lbl))
                c += cells(key, 2, True, strong=(cls == "row-subtotal"))
            if i == 0:
                s = r[span_target_key]["values"]
                c.append(vs_target(s.get("2025"), target_of(s, 2024))
                         .replace("<td ", '<td rowspan="%d" style="vertical-align:middle;" ' % len(keys)))
            out.append(row(c, ("group-start " + cls).strip() if i == 0 else cls))
        return out

    rows = []
    rows += grp("일반", [("gen_recycle", "재활용"), ("gen_incin", "소각"), ("gen_landfill", "매립"),
                        ("gen_total", "계"), ("gen_intensity", "원단위")], "gen_intensity")
    rows += grp("지정", [("des_recycle", "재활용"), ("des_incin", "소각"), ("des_landfill", "매립"),
                        ("des_total", "계"), ("des_intensity", "원단위")], "des_intensity")
    s = r["waste_total"]["values"]
    rows.append(row(['<td colspan="2" class="label-col"><strong>폐기물 합계</strong></td>']
                    + cells("waste_total", 2, True, strong=True)
                    + [vs_target(r["waste_intensity"]["values"].get("2025"),
                                 target_of(r["waste_intensity"]["values"], 2024))], "row-total"))
    rows.append(row(['<td colspan="2" class="label-col accent-text"><strong>폐기물 집약도</strong> '
                     '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted); '
                     'white-space:nowrap;">(ton / 매출액 億)</span></td>']
                    + cells("waste_intensity", 3, False, accent=True) + ["<td></td>"], "row-intensity"))

    tbl = ('%s    <table class="data-table data-table-grouped">\n%s      <thead>\n'
           '%s        <tr><th colspan="2">구분</th>%s</tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, _three_year_head(), IND, IND, "\n".join(rows), IND, IND))
    note = ("일반&middot;지정폐기물 전량을 적법 위탁 처리한 하남사업장 실적입니다. 목표는 전년 실적 대비 3% 감축 "
            "기준이며, &lsquo;목표 대비&rsquo;는 매출액 기준 집약도로 비교한 값입니다.")
    return wrapper("폐기물 발생 및 처리 실적", "TR-AP-150a.1", tbl, note)


def block_material(d):
    r = d["resources"]

    def cells(key, nd=2, comma=True, strong=False, accent=False):
        s = r[key]["values"]
        t = target_of(s, 2024)
        vals = [s.get("2023"), s.get("2024"), t, s.get("2025")]
        return ['<td class="num%s">%s</td>'
                % (" accent" if accent else "",
                   ("<strong>%s</strong>" % n(v, nd, comma)) if strong else n(v, nd, comma))
                for v in vals]

    rows = [
        row(['<td class="label-col">범퍼용 수지 (ton/yr)</td>'] + cells("bumper_resin")
            + [vs_target(r["material_intensity"]["values"].get("2025"),
                         target_of(r["material_intensity"]["values"], 2024))
               .replace("<td ", '<td rowspan="4" style="vertical-align:middle;" ')]),
        row(['<td class="label-col">도료 (ton/yr)</td>'] + cells("paint")),
        row(['<td class="label-col"><strong>계</strong></td>'] + cells("material_total", strong=True), "row-subtotal"),
        row(['<td class="label-col accent-text"><strong>사용집약도</strong><br>'
             '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted);">ton / 매출액 億</span></td>']
            + cells("material_intensity", 3, False, accent=True), "row-intensity"),
    ]
    tbl = ('%s    <table class="data-table data-table-grouped">\n%s      <thead>\n'
           '%s        <tr><th>구분</th>%s</tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, _three_year_head(), IND, IND, "\n".join(rows), IND, IND))
    note = "목표는 전년 실적 대비 3% 감축 기준이며, &lsquo;목표 대비&rsquo;는 매출액 기준 사용집약도로 비교한 값입니다."
    return wrapper("원부자재 사용량", "FY 2023 ~ 2025", tbl, note)


def block_circularity(d):
    r, c = d["resources"], d["circularity"]

    def cells(key, nd=2, comma=True, accent=False, is_pct=False, higher=True):
        s = r[key]["values"]
        t = target_of(s, 2024, higher_is_better=higher)
        vals = [s.get("2023"), s.get("2024"), t, s.get("2025")]
        f = (lambda v: pct(v)) if is_pct else (lambda v: n(v, nd, comma))
        return ['<td class="num%s">%s</td>' % (" accent" if accent else "", f(v)) for v in vals]

    rows = [
        row(['<td class="label-col"><strong>재활용량 (ton)</strong></td>'] + cells("recycled")
            + [vs_target(r["recycled_intensity"]["values"].get("2025"),
                         target_of(r["recycled_intensity"]["values"], 2024, True), higher_is_better=True)]),
        row(['<td class="label-col accent-text"><strong>재활용 집약도</strong> '
             '<span style="font-weight:400; font-size:0.85em; color:var(--text-muted); white-space:nowrap;">'
             '(ton / 매출액 億)</span></td>']
            + cells("recycled_intensity", 3, False, accent=True) + ["<td></td>"], "row-intensity"),
        row(['<td class="label-col accent-text"><strong>재활용률</strong></td>']
            + cells("recycle_rate", accent=True, is_pct=True)
            + [vs_target(r["recycle_rate"]["values"].get("2025"),
                         target_of(r["recycle_rate"]["values"], 2024, True), higher_is_better=True)],
            "row-highlight"),
    ]
    tbl = ('%s    <table class="data-table data-table-grouped">\n%s      <thead>\n'
           '%s        <tr><th>구분</th><th class="num">2023</th><th class="num">2024</th>'
           '<th class="num">목표<br><span style="font-weight:400; font-size:0.85em;">(3%% 증가)</span></th>'
           '<th class="num">2025</th><th class="num">목표 대비</th></tr>\n%s      </thead>\n'
           '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
           % (IND, IND, IND, IND, IND, "\n".join(rows), IND, IND))

    # 자원순환 성과관리 지표 (2024 vs 2025)
    def d2(key, nd=2, suffix=""):
        a, b = c[key].get("2024"), c[key].get("2025")
        return a, b, ((b - a) if a is not None and b is not None else None)

    crows = []
    for key, label, better_down, suffix in (
            ("generated", "폐기물 발생량 (톤)", True, ""),
            ("recycled_real", "실질 재활용량 (톤)", False, ""),
            ("final_disposal", "최종처분량 (톤)", True, ""),
            ("circular_rate", "순환이용률", False, "%"),
            ("final_disposal_rate", "최종처분율", True, "%")):
        a, b, diff = d2(key)
        good = (diff <= 0) if better_down else (diff >= 0)
        arrow = "&#9660;" if diff < 0 else "&#9650;"
        unit = "%p" if suffix else "%"
        val = format(abs(diff), ".2f") if suffix else format(abs(diff / a * 100), ".2f")
        cls = "row-highlight" if suffix else ""
        lab = ('<td class="label-col accent-text"><strong>%s</strong></td>' % label) if suffix \
            else ('<td class="label-col">%s</td>' % label)
        crows.append(row([lab,
                          '<td class="num%s">%s%s</td>' % (" accent" if suffix else "", n(a, 2), suffix),
                          '<td class="num%s">%s%s</td>' % (" accent" if suffix else "", n(b, 2), suffix),
                          '<td class="num %s">%s %s%s</td>' % ("good" if good else "bad", arrow, val, unit)],
                         cls))
    ctbl = ('%s    <table class="data-table">\n%s      <thead>\n'
            '%s        <tr><th>구분</th><th class="num">2024</th><th class="num">2025</th>'
            '<th class="num">증감</th></tr>\n%s      </thead>\n'
            '%s      <tbody>\n%s\n%s      </tbody>\n%s    </table>'
            % (IND, IND, IND, IND, IND, "\n".join(crows), IND, IND))

    return ("\n\n".join([
        wrapper("재활용 실적", "FY 2023 ~ 2025", tbl,
                "목표는 전년 실적 대비 3% 증가 기준입니다. &#9650;는 목표 달성을 뜻합니다."),
        wrapper("자원순환 성과", "FY 2024 ~ 2025", ctbl,
                "자원순환기본법 자원순환 성과관리 산정 기준. 순환이용률 상승과 최종처분율 하락은 모두 개선을 의미합니다."),
    ]))


BLOCKS = {
    "ENERGY": block_energy,
    "GHG": block_ghg,
    "AIR": block_air,
    "WATER": block_water,
    "WASTE": block_waste,
    "MATERIAL": block_material,
    "CIRCULARITY": block_circularity,
}


def main():
    with open(DATA, encoding="utf-8") as f:
        d = json.load(f)
    with open(PAGE, "rb") as f:
        raw = f.read()
    eol = b"\r\n" if b"\r\n" in raw else b"\n"
    html = raw.decode("utf-8")

    for name, fn in BLOCKS.items():
        body = fn(d).replace("\r\n", "\n")
        pat = re.compile(r"(<!-- ESG:%s:START -->).*?(<!-- ESG:%s:END -->)" % (name, name), re.S)
        if not pat.search(html):
            sys.exit("마커 없음: ESG:%s" % name)
        html = pat.sub(lambda m: "%s\n%s\n%s%s" % (m.group(1), body, IND, m.group(2)), html)
        print("  생성 ESG:%-12s %5d 자" % (name, len(body)))

    # 임시 파일에 먼저 쓰고 교체한다. 생성 도중 예외가 나도 원본이 비지 않도록.
    out = eol.join(line.encode("utf-8")
                   for line in html.replace("\r\n", "\n").split("\n"))
    tmp = PAGE + ".tmp"
    with open(tmp, "wb") as f:
        f.write(out)
    os.replace(tmp, PAGE)
    print("\n반영:", PAGE)


if __name__ == "__main__":
    main()
