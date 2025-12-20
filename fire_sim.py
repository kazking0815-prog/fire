import streamlit as st
import pandas as pd
import json
import os
import numpy as np
import plotly.graph_objects as go

# ページ設定 (ワイド表示)
st.set_page_config(page_title="FIREシミュレーター (Web版)", layout="wide")

# --- CSSでサイドバーの幅を広げる ---
st.markdown(
    """
    <style>
    [data-testid="stSidebar"] {
        min-width: 400px;
        max-width: 800px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# --- 設定ファイル管理 (Web版対応: アップロード機能) ---
# ※リポジトリ内にfire_config.jsonがある場合は初期値として使います
def load_default_config():
    if os.path.exists('fire_config.json'):
        try:
            with open('fire_config.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

st.title("🔥 FIREシミュレーター (Web版)")
st.markdown("設定データを **JSONファイル** として手元のPCに保存・読込できるバージョンです。")

# --- サイドバーヘッダー ---
st.sidebar.header("📝 設定メニュー")

# ★設定ファイルのアップロード機能
uploaded_file = st.sidebar.file_uploader("📂 前回の設定を読み込む", type=["json"])

if uploaded_file is not None:
    try:
        config = json.load(uploaded_file)
        st.sidebar.success("設定を読み込みました！")
    except:
        st.sidebar.error("ファイルの読み込みに失敗しました")
        config = load_default_config()
else:
    # アップロードがない場合はデフォルト(または空)
    config = load_default_config()

# リセットボタン
if 'reset_confirmation' not in st.session_state:
    st.session_state.reset_confirmation = False

if st.sidebar.button("🗑️ 入力を初期化する"):
    st.session_state.reset_confirmation = True

if st.session_state.reset_confirmation:
    st.sidebar.warning("⚠️ 初期値に戻しますか？")
    col_res1, col_res2 = st.sidebar.columns(2)
    with col_res1:
        if st.button("はい", type="primary"):
            st.session_state.reset_confirmation = False
            # ページをリロードして初期状態(アップロードなし)に戻す
            st.rerun()
    with col_res2:
        if st.button("キャンセル"):
            st.session_state.reset_confirmation = False
            st.rerun()
    st.sidebar.markdown("---")

tab1, tab2, tab3, tab4, tab5, tab6 = st.sidebar.tabs(["👤 基本・家族", "💰 投資計画", "💴 収入", "🎓 教育費", "🏠 イベント・ローン", "📈 経済・リスク"])

def get_val(key, default):
    return config.get(key, default)

# ==========================================
# タブ1: 基本設定
# ==========================================
with tab1:
    st.subheader("基本プロフィール")
    current_age = st.number_input("現在の年齢 (世帯主)", 20, 100, int(get_val("current_age", 30)))
    life_expectancy = st.number_input("想定寿命 (世帯主)", current_age + 1, 120, int(get_val("life_expectancy", 95)))
    
    st.markdown("---")
    st.subheader("家族構成")
    if "family_structure" in config:
        df_family_init = pd.DataFrame(config["family_structure"])
    else:
        df_family_init = pd.DataFrame([
            {"続柄": "配偶者", "年齢": 28},
            {"続柄": "第一子", "年齢": 2},
        ])
    edited_family = st.data_editor(df_family_init, num_rows="dynamic", key="family_editor", use_container_width=True)
    
    family_age_map = {"本人": current_age}
    family_members_list = ["本人"]
    children_list = [] 
    spouse_exists = False
    if not edited_family.empty and "続柄" in edited_family.columns and "年齢" in edited_family.columns:
        for index, row in edited_family.iterrows():
            if row["続柄"]:
                name = row["続柄"]
                try:
                    age = int(row["年齢"])
                    family_age_map[name] = age
                    family_members_list.append(name)
                    if "配偶者" in name or "妻" in name or "夫" in name:
                        spouse_exists = True
                        family_age_map["配偶者"] = age 
                    if "子" in name or (name not in ["本人", "配偶者", "夫", "妻"]):
                        children_list.append({"name": name, "age": age})
                except:
                    pass

    st.markdown("---")
    st.subheader("FIRE目標・現在資産")
    target_fire_age = st.number_input("FIRE目標年齢 (積立終了)", current_age + 1, 100, int(get_val("target_fire_age", 45)))
    
    st.caption("現在の資産内訳")
    current_asset_nisa = st.number_input("① 新NISA残高 (万円)", 0, 500000, int(get_val("current_asset_nisa", 0)))
    current_asset_ideco = st.number_input("② iDeCo残高 (万円)", 0, 500000, int(get_val("current_asset_ideco", 0)))
    current_asset_taxable = st.number_input("③ 特定口座残高 (万円)", 0, 500000, int(get_val("current_asset_taxable", 500)))
    current_asset_cash = st.number_input("④ 現金・預金残高 (万円)", 0, 500000, int(get_val("current_asset_cash", 500)))
    
    current_assets = current_asset_nisa + current_asset_ideco + current_asset_taxable + current_asset_cash
    st.info(f"💰 総資産合計: **{int(current_assets):,} 万円**")
    
    st.markdown("---")
    st.subheader("基本生活費 (年齢別)")
    st.caption("年齢ごとの年間支出額を設定してください。")
    
    if "expense_schedule" in config:
        df_exp_sched_init = pd.DataFrame(config["expense_schedule"])
    else:
        # デフォルトは全期間一定
        default_exp = int(get_val("annual_expense_fire", 300))
        df_exp_sched_init = pd.DataFrame([
            {"開始年齢": current_age, "終了年齢": 70, "年間支出(万円)": default_exp, "備考": "活動期"},
            {"開始年齢": 70, "終了年齢": life_expectancy + 10, "年間支出(万円)": int(default_exp * 0.9), "備考": "高齢期"},
        ])

    edited_expense_schedule = st.data_editor(
        df_exp_sched_init,
        column_config={
            "開始年齢": st.column_config.NumberColumn("開始", min_value=0, width="small"),
            "終了年齢": st.column_config.NumberColumn("終了", min_value=0, width="small"),
            "年間支出(万円)": st.column_config.NumberColumn("年額(万円)", min_value=0, width="small"),
            "備考": st.column_config.TextColumn("備考", width="medium"),
        },
        num_rows="dynamic", key="expense_sched_editor", use_container_width=True
    )

# --- タブ2: 投資計画 ---
with tab2:
    st.subheader("口座別積立スケジュール")
    if "investment_schedule_v4" in config:
        df_invest_init = pd.DataFrame(config["investment_schedule_v4"])
    else:
        df_invest_init = pd.DataFrame([
            {"口座": "新NISA", "開始年齢": current_age, "終了年齢": target_fire_age, "年間積立額(万円)": 360},
            {"口座": "iDeCo", "開始年齢": current_age, "終了年齢": 60, "年間積立額(万円)": 27},
            {"口座": "特定口座", "開始年齢": current_age, "終了年齢": target_fire_age, "年間積立額(万円)": 100},
        ])
    edited_invest_schedule = st.data_editor(
        df_invest_init,
        column_config={
            "口座": st.column_config.SelectboxColumn("口座種類", options=["新NISA", "iDeCo", "特定口座"], required=True, width="medium"),
            "開始年齢": st.column_config.NumberColumn("開始", min_value=0, width="small"),
            "終了年齢": st.column_config.NumberColumn("終了", min_value=0, width="small"),
            "年間積立額(万円)": st.column_config.NumberColumn("積立額", min_value=0, width="small"),
        },
        num_rows="dynamic", key="invest_editor", use_container_width=True
    )

# --- タブ3: 収入設定 ---
with tab3:
    st.subheader("世帯全体の労働収入")
    if "income_schedule_v3" in config:
        df_income_init = pd.DataFrame(config["income_schedule_v3"])
    else:
        df_income_init = pd.DataFrame([
            {"対象": "本人", "開始年齢": target_fire_age, "終了年齢": 65, "年収(万円)": 100, "貯蓄反映率(%)": 100},
        ])
    edited_income_schedule = st.data_editor(
        df_income_init,
        column_config={
            "対象": st.column_config.SelectboxColumn("対象", options=family_members_list, required=True, width="medium"),
            "開始年齢": st.column_config.NumberColumn("開始", min_value=0, width="small"),
            "終了年齢": st.column_config.NumberColumn("終了", min_value=0, width="small"),
            "年収(万円)": st.column_config.NumberColumn("年収", min_value=0, width="small"),
            "貯蓄反映率(%)": st.column_config.NumberColumn("貯蓄率", min_value=0, max_value=100, width="small"),
        },
        num_rows="dynamic", key="income_editor", use_container_width=True
    )
    st.divider()
    st.subheader("年金・退職金設定")
    col_p1, col_p2 = st.columns(2)
    with col_p1:
        st.markdown("### 👨 世帯主")
        pension_start_age = st.number_input("受給開始年齢", 60, 80, int(get_val("pension_start_age", 65)), key="head_p_age")
        pension_monthly_amount = st.number_input("年金月額 (万円)", 0, 1000, int(get_val("pension_monthly_amount", 15)), key="head_p_amt")
        retirement_income_age = st.number_input("退職金受給年齢", current_age, 80, int(get_val("retirement_income_age", 60)), key="head_r_age")
        retirement_income_amount = st.number_input("退職金手取り (万円)", 0, 10000, int(get_val("retirement_income_amount", 1500)), key="head_r_amt")
    with col_p2:
        st.markdown("### 👩 配偶者")
        if not spouse_exists:
            st.warning("家族構成に配偶者が設定されていません。")
        spouse_pension_start_age = st.number_input("受給開始年齢 ", 60, 80, int(get_val("spouse_pension_start_age", 65)), key="spouse_p_age")
        spouse_pension_monthly_amount = st.number_input("年金月額 (万円) ", 0, 1000, int(get_val("spouse_pension_monthly_amount", 7)), key="spouse_p_amt")
        spouse_retirement_income_age = st.number_input("退職金受給年齢 ", current_age, 80, int(get_val("spouse_retirement_income_age", 60)), key="spouse_r_age")
        spouse_retirement_income_amount = st.number_input("退職金手取り (万円) ", 0, 10000, int(get_val("spouse_retirement_income_amount", 0)), key="spouse_r_amt")

# --- タブ4: 教育費設定 ---
with tab4:
    st.subheader("🏫 教育費設定")
    if "edu_master" in config:
        df_edu_master = pd.DataFrame(config["edu_master"])
    else:
        df_edu_master = pd.DataFrame([
            {"区分": "未就学児0-3歳", "選択肢": "保育園", "計(万円)": 106},
            {"区分": "未就学児0-3歳", "選択肢": "自宅保育", "計(万円)": 58},
            {"区分": "未就学児4-6歳", "選択肢": "保育園(無償化)", "計(万円)": 58},
            {"区分": "未就学児4-6歳", "選択肢": "幼稚園(公立)", "計(万円)": 80},
            {"区分": "未就学児4-6歳", "選択肢": "幼稚園(私立)", "計(万円)": 111},
            {"区分": "小学校", "選択肢": "公立", "計(万円)": 98},
            {"区分": "小学校", "選択肢": "私立", "計(万円)": 226},
            {"区分": "中学校", "選択肢": "公立", "計(万円)": 129},
            {"区分": "中学校", "選択肢": "私立", "計(万円)": 221},
            {"区分": "高校", "選択肢": "公立", "計(万円)": 126},
            {"区分": "高校", "選択肢": "私立", "計(万円)": 177},
            {"区分": "大学", "選択肢": "進学しない", "計(万円)": 0},
            {"区分": "大学", "選択肢": "公立・自宅", "計(万円)": 107},
            {"区分": "大学", "選択肢": "公立・下宿", "計(万円)": 175},
            {"区分": "大学", "選択肢": "私立文系・自宅", "計(万円)": 160},
            {"区分": "大学", "選択肢": "私立文系・下宿", "計(万円)": 228},
            {"区分": "大学", "選択肢": "私立理系・自宅", "計(万円)": 197},
            {"区分": "大学", "選択肢": "私立理系・下宿", "計(万円)": 265},
            {"区分": "大学", "選択肢": "私立医歯系・自宅", "計(万円)": 520},
            {"区分": "大学", "選択肢": "私立医歯系・下宿", "計(万円)": 588},
        ])
    edited_edu_master = st.data_editor(df_edu_master, num_rows="dynamic", key="edu_master_editor", use_container_width=True)
    
    st.markdown("#### 👶 お子様の進路")
    child_plans = {}
    if children_list:
        saved_plans = config.get("child_edu_plans", {})
        for child in children_list:
            c_name = child["name"]
            c_age = child["age"]
            with st.expander(f"{c_name} (現在{c_age}歳) の進路", expanded=True):
                plan = saved_plans.get(c_name, {})
                def get_options(stage_name):
                    return edited_edu_master[edited_edu_master["区分"].str.contains(stage_name, na=False)]["選択肢"].tolist() or ["設定なし"]
                def get_idx(options, val):
                    return options.index(val) if val in options else 0

                c1, c2, c3 = st.columns(3)
                s_03 = c1.selectbox(f"0-3歳", get_options("0-3歳"), index=get_idx(get_options("0-3歳"), plan.get("0-3歳")), key=f"{c_name}_03")
                s_46 = c1.selectbox(f"4-6歳", get_options("4-6歳"), index=get_idx(get_options("4-6歳"), plan.get("4-6歳")), key=f"{c_name}_46")
                s_el = c2.selectbox(f"小学校", get_options("小学校"), index=get_idx(get_options("小学校"), plan.get("小学校")), key=f"{c_name}_el")
                s_jh = c2.selectbox(f"中学校", get_options("中学校"), index=get_idx(get_options("中学校"), plan.get("中学校")), key=f"{c_name}_jh")
                s_hi = c3.selectbox(f"高校", get_options("高校"), index=get_idx(get_options("高校"), plan.get("高校")), key=f"{c_name}_hi")
                s_un = c3.selectbox(f"大学", get_options("大学"), index=get_idx(get_options("大学"), plan.get("大学")), key=f"{c_name}_un")
                child_plans[c_name] = {"0-3歳": s_03, "4-6歳": s_46, "小学校": s_el, "中学校": s_jh, "高校": s_hi, "大学": s_un}
    else:
        st.info("お子様がいません")

# --- タブ5: イベント・ローン ---
with tab5:
    st.subheader("ライフイベント (一時支出)")
    if "life_events" in config:
        df_event_init = pd.DataFrame(config["life_events"])
    else:
        df_event_init = pd.DataFrame([{"年齢": current_age + 10, "費用(万円)": 1000, "内容": "住宅頭金"}])
    edited_events = st.data_editor(df_event_init, num_rows="dynamic", key="event_editor", use_container_width=True)

    st.markdown("---")
    st.subheader("🏦 住宅ローン設定")
    use_loan = st.checkbox("住宅ローンを利用する", get_val("use_loan", False))
    
    loan_amount = 0
    annual_repayment = 0
    loan_start_age = 0
    loan_duration = 0
    
    if use_loan:
        raw_amount = int(get_val("loan_amount", 4000))
        loan_amount = st.number_input("借入金額 (万円)", 0, 50000, raw_amount, step=100)
        
        raw_rate = float(get_val("loan_rate", 1.5))
        loan_rate = st.number_input("金利 (年利 %)", 0.0, 10.0, raw_rate, 0.01)
        
        raw_duration = int(get_val("loan_duration", 35))
        safe_duration = max(1, raw_duration) 
        loan_duration = st.number_input("返済期間 (年)", 1, 50, safe_duration, 1)
        
        raw_start_age = int(get_val("loan_start_age", current_age + 10))
        safe_start_age = max(current_age, raw_start_age)
        loan_start_age = st.number_input("返済開始年齢", current_age, 80, safe_start_age, 1)
        
        r = loan_rate / 100 / 12
        n = loan_duration * 12
        P = loan_amount * 10000
        if r > 0:
            monthly_payment = P * r * (1 + r)**n / ((1 + r)**n - 1)
        else:
            monthly_payment = P / n
        annual_repayment = monthly_payment * 12
        total_payment = annual_repayment * loan_duration
        interest_total = total_payment - P
        st.success(f"毎年の返済額: **{int(annual_repayment/10000):,} 万円** (月々 {int(monthly_payment):,} 円)")

# --- タブ6: 経済・リスク ---
with tab6:
    st.subheader("経済シミュレーション前提")
    investment_return = st.slider("投資資産の期待リターン (年利 %)", 0.0, 15.0, float(get_val("investment_return", 5.0)), 0.1) / 100
    inflation_rate = st.slider("インフレ率 (年率 %)", -1.0, 5.0, float(get_val("inflation_rate", 2.0)), 0.1) / 100
    
    st.divider()
    st.subheader("📊 グラフ設定")
    graph_height = st.slider("グラフの高さ (px)", 400, 1500, 700, step=50)

    st.divider()
    st.subheader("🎲 リスク分析 (モンテカルロ法)")
    use_monte_carlo = st.checkbox("モンテカルロ・シミュレーションを行う", get_val("use_monte_carlo", False))
    if use_monte_carlo:
        raw_risk = float(get_val("risk_std", 15.0))
        default_risk = 15.0 if raw_risk == 0.0 else raw_risk
        risk_std = st.slider("投資リスク (標準偏差 %)", 0.0, 30.0, default_risk, 0.1) / 100
        
        raw_sim_count = int(get_val("sim_count", 100))
        default_sim_count = 100 if raw_sim_count < 10 else raw_sim_count
        sim_count = st.number_input("試行回数", 10, 1000, default_sim_count, step=50)
    else:
        risk_std = 0
        sim_count = 1

# --- 設定収集 ---
current_config_state = {
    "current_age": current_age,
    "life_expectancy": life_expectancy,
    "family_structure": edited_family.to_dict('records'),
    "target_fire_age": target_fire_age,
    "current_asset_nisa": current_asset_nisa,
    "current_asset_ideco": current_asset_ideco,
    "current_asset_taxable": current_asset_taxable,
    "current_asset_cash": current_asset_cash,
    "expense_schedule": edited_expense_schedule.to_dict('records'),
    "investment_schedule_v4": edited_invest_schedule.to_dict('records'),
    "edu_master": edited_edu_master.to_dict('records'),
    "child_edu_plans": child_plans,
    "income_schedule_v3": edited_income_schedule.to_dict('records'),
    "pension_start_age": pension_start_age,
    "pension_monthly_amount": pension_monthly_amount,
    "retirement_income_age": retirement_income_age,
    "retirement_income_amount": retirement_income_amount,
    "spouse_pension_start_age": spouse_pension_start_age,
    "spouse_pension_monthly_amount": spouse_pension_monthly_amount,
    "spouse_retirement_income_age": spouse_retirement_income_age,
    "spouse_retirement_income_amount": spouse_retirement_income_amount,
    "investment_return": investment_return * 100,
    "inflation_rate": inflation_rate * 100,
    "life_events": edited_events.to_dict('records'),
    "use_loan": use_loan,
    "loan_amount": loan_amount if use_loan else 0,
    "loan_rate": loan_rate if use_loan else 0,
    "loan_duration": loan_duration if use_loan else 0,
    "loan_start_age": loan_start_age if use_loan else 0,
    "use_monte_carlo": use_monte_carlo,
    "risk_std": risk_std * 100,
    "sim_count": sim_count,
    "use_detailed_portfolio": False, 
    "portfolio_settings": []
}

# --- 保存機能 (Web版対応: ダウンロードボタン) ---
st.sidebar.markdown("---")
st.sidebar.write("💾 **設定を保存する**")
st.sidebar.caption("現在の入力内容をJSONファイルとして保存します。次回はこのファイルを「前回の設定を読み込む」へアップロードしてください。")

json_str = json.dumps(current_config_state, indent=4, ensure_ascii=False)

st.sidebar.download_button(
    label="📥 設定ファイル(JSON)を保存",
    data=json_str,
    file_name='fire_config.json',
    mime='application/json',
    type="primary"
)

# ==========================================
# シミュレーション実行ロジック
# ==========================================
def run_simulation(ages, rand_returns=None):
    val_nisa = current_asset_nisa * 10000
    principal_nisa_lifetime = val_nisa 
    val_ideco = current_asset_ideco * 10000
    val_taxable = current_asset_taxable * 10000
    principal_taxable = val_taxable 
    val_cash = current_asset_cash * 10000 

    TAX_RATE = 0.20315
    NISA_ANNUAL_LIMIT = 360 * 10000
    NISA_LIFETIME_LIMIT = 1800 * 10000
    
    # 年金月額の年換算
    head_pension_annual = pension_monthly_amount * 12 * 10000
    head_retirement_val = retirement_income_amount * 10000
    spouse_pension_annual = spouse_pension_monthly_amount * 12 * 10000
    spouse_retirement_val = spouse_retirement_income_amount * 10000

    local_history = []
    
    life_event_dict = {}
    for index, row in edited_events.iterrows():
        try:
            age_key = int(row["年齢"])
            cost_val = int(row["費用(万円)"]) * 10000
            if age_key in life_event_dict: life_event_dict[age_key].append(cost_val)
            else: life_event_dict[age_key] = [cost_val]
        except: pass

    def get_edu_cost(stage_keyword, selection):
        if not selection: return 0
        try:
            row = edited_edu_master[
                (edited_edu_master["区分"].str.contains(stage_keyword, na=False)) & 
                (edited_edu_master["選択肢"] == selection)
            ]
            if not row.empty: return int(row.iloc[0]["計(万円)"]) * 10000
        except: pass
        return 0

    success = True
    depletion = None

    for i, age in enumerate(ages):
        years_passed = age - current_age
        
        # 1. 資産運用
        current_return = rand_returns[i] if rand_returns is not None else investment_return
        val_nisa *= (1 + current_return)
        val_ideco *= (1 + current_return)
        val_taxable *= (1 + current_return)
        
        inflation_factor = (1 + inflation_rate) ** years_passed
        
        inflow_invest = 0
        inflow_labor = 0
        inflow_pension = 0
        tax_paid = 0
        
        # ★生活費計算（年齢別スケジュール参照）
        target_living = 0
        if age >= target_fire_age:
            # デフォルト値
            base_living = 0 
            # スケジュールから検索
            match_found = False
            for index, row in edited_expense_schedule.iterrows():
                try:
                    s = int(row["開始年齢"])
                    e = int(row["終了年齢"])
                    amt = int(row["年間支出(万円)"]) * 10000
                    if s <= age < e:
                        base_living = amt
                        match_found = True
                        break # 最初に見つかった行を優先
                except: pass
            
            target_living = base_living * inflation_factor
        
        cost_edu = 0
        for child in children_list:
            c_name = child["name"]
            c_sim_age = child["age"] + years_passed 
            plan = child_plans.get(c_name, {})
            c_cost = 0
            if 0 <= c_sim_age <= 3: c_cost = get_edu_cost("0-3歳", plan.get("0-3歳"))
            elif 4 <= c_sim_age <= 6: c_cost = get_edu_cost("4-6歳", plan.get("4-6歳"))
            elif 7 <= c_sim_age <= 12: c_cost = get_edu_cost("小学校", plan.get("小学校"))
            elif 13 <= c_sim_age <= 15: c_cost = get_edu_cost("中学校", plan.get("中学校"))
            elif 16 <= c_sim_age <= 18: c_cost = get_edu_cost("高校", plan.get("高校"))
            elif 19 <= c_sim_age <= 22: c_cost = get_edu_cost("大学", plan.get("大学"))
            cost_edu += c_cost * inflation_factor

        cost_event = 0
        if age in life_event_dict:
            cost_event = sum(life_event_dict[age]) * inflation_factor

        cost_loan = 0
        if use_loan and loan_start_age <= age < loan_start_age + loan_duration:
            cost_loan = annual_repayment

        total_expense = target_living + cost_edu + cost_event + cost_loan

        # 2. 収入・積立
        for index, row in edited_invest_schedule.iterrows():
            try:
                ac_type = row["口座"]
                start = int(row["開始年齢"])
                end = int(row["終了年齢"])
                amount = int(row["年間積立額(万円)"]) * 10000
                if start <= age < end:
                    if ac_type == "新NISA":
                        dep = min(amount, NISA_ANNUAL_LIMIT)
                        rem = NISA_LIFETIME_LIMIT - principal_nisa_lifetime
                        dep = min(dep, max(0, rem))
                        val_nisa += dep
                        principal_nisa_lifetime += dep
                        inflow_invest += dep
                        overflow = amount - dep
                        if overflow > 0:
                            val_taxable += overflow
                            principal_taxable += overflow
                            inflow_invest += overflow
                    elif ac_type == "iDeCo":
                        if age < 60:
                            val_ideco += amount
                            inflow_invest += amount
                    else:
                        val_taxable += amount
                        principal_taxable += amount
                        inflow_invest += amount
            except: pass

        total_income_cash = 0
        for index, row in edited_income_schedule.iterrows():
            try:
                t_name = row["対象"]
                s_age = int(row["開始年齢"])
                e_age = int(row["終了年齢"])
                inc = int(row["年収(万円)"]) * 10000
                rate = float(row.get("貯蓄反映率(%)", 100))
                
                t_real = family_age_map.get(t_name, current_age)
                t_sim = t_real + years_passed
                
                if s_age <= t_sim < e_age:
                    val = inc * inflation_factor
                    if age < target_fire_age:
                        surplus = val * (rate / 100)
                        inflow_labor += surplus
                        val_taxable += surplus
                        principal_taxable += surplus
                    else:
                        total_income_cash += val
            except: pass

        if age >= pension_start_age:
            v = head_pension_annual * inflation_factor
            total_income_cash += v
            inflow_pension += v
        if age == retirement_income_age:
            v = head_retirement_val * inflation_factor
            total_income_cash += v
            inflow_pension += v
            
        spouse_age_current = family_age_map.get("配偶者", None)
        if spouse_age_current is not None:
            spouse_sim_age = spouse_age_current + years_passed
            if spouse_sim_age >= spouse_pension_start_age:
                v = spouse_pension_annual * inflation_factor
                total_income_cash += v
                inflow_pension += v
            if spouse_sim_age == spouse_retirement_income_age:
                v = spouse_retirement_val * inflation_factor
                total_income_cash += v
                inflow_pension += v

        deficit = total_expense - total_income_cash
        
        if deficit > 0:
            rem_def = deficit
            if val_cash > 0:
                use = min(val_cash, rem_def)
                val_cash -= use
                rem_def -= use
            
            if rem_def > 0 and val_taxable > 0:
                profit_ratio = (val_taxable - principal_taxable)/val_taxable if val_taxable > principal_taxable else 0
                effective_rate = 1 - (profit_ratio * TAX_RATE)
                gross_sell = rem_def / effective_rate
                
                if gross_sell <= val_taxable:
                    tax = gross_sell - rem_def
                    val_taxable -= gross_sell
                    principal_taxable -= (gross_sell * (1 - profit_ratio))
                    tax_paid += tax
                    rem_def = 0
                else:
                    realized_gain = val_taxable - principal_taxable
                    tax = max(0, realized_gain * TAX_RATE)
                    net = val_taxable - tax
                    rem_def -= net
                    tax_paid += tax
                    val_taxable = 0
                    principal_taxable = 0
            
            if rem_def > 0 and val_nisa > 0:
                use = min(val_nisa, rem_def)
                val_nisa -= use
                rem_def -= use
            
            if rem_def > 0 and val_ideco > 0 and age >= 60:
                use = min(val_ideco, rem_def)
                val_ideco -= use
                rem_def -= use
                
        else:
            val_cash += (-deficit)

        total_end = val_nisa + val_ideco + val_taxable + val_cash
        
        if total_end < 10000 and success and age >= target_fire_age:
            success = False
            depletion = age

        local_history.append({
            "年齢": age,
            "総資産(万円)": int(total_end / 10000),
            "現金(万円)": int(val_cash / 10000),
            "特定口座(万円)": int(val_taxable / 10000),
            "NISA(万円)": int(val_nisa / 10000),
            "iDeCo(万円)": int(val_ideco / 10000),
            "積立額(万円)": int(inflow_invest / 10000),
            "支出計(万円)": int(total_expense / 10000),
            "住宅ローン(万円)": int(cost_loan / 10000),
        })

    return pd.DataFrame(local_history), success, depletion

ages = list(range(current_age, life_expectancy + 1))

# --- 結果表示 ---
st.divider()
st.header("📊 シミュレーション結果")

if use_monte_carlo:
    with st.spinner(f"{sim_count}回のシミュレーションを実行中..."):
        sim_results = []
        success_count = 0
        all_assets_matrix = np.zeros((sim_count, len(ages)))
        
        for i in range(sim_count):
            rand_returns = np.random.normal(investment_return, risk_std, len(ages))
            df_res, is_succ, dep_age = run_simulation(ages, rand_returns)
            all_assets_matrix[i, :] = df_res["総資産(万円)"].values
            if is_succ: success_count += 1
            
        success_rate = (success_count / sim_count) * 100
        median_assets = np.median(all_assets_matrix, axis=0)
        p10_assets = np.percentile(all_assets_matrix, 10, axis=0)
        p90_assets = np.percentile(all_assets_matrix, 90, axis=0)
        
        col1, col2, col3 = st.columns(3)
        col1.metric("成功率 (枯渇しない確率)", f"{success_rate:.1f}%")
        final_median = int(median_assets[-1])
        col2.metric("資産中央値 (終了時)", f"{final_median:,} 万円")
        col3.caption(f"試行回数: {sim_count}回")
        
        if success_rate < 50: st.error("⚠️ 成功率が低い(50%未満)です。")
        elif success_rate < 80: st.warning("⚠️ 少しリスクがあります(80%未満)。")
        else: st.success("🎉 安全圏です(80%以上)。")

        # --- Plotly Chart: Monte Carlo ---
        st.subheader("資産推移 (リスク分析・インタラクティブ)")
        fig_mc = go.Figure()

        # 80%範囲 (塗りつぶし)
        # 上限ライン (透明)
        fig_mc.add_trace(go.Scatter(
            x=ages, y=p90_assets,
            mode='lines', line=dict(width=0),
            showlegend=False, hoverinfo='skip'
        ))
        # 下限ライン (上限まで塗りつぶす)
        fig_mc.add_trace(go.Scatter(
            x=ages, y=p10_assets,
            mode='lines', line=dict(width=0),
            fill='tonexty', fillcolor='rgba(31, 119, 180, 0.2)',
            name='80%確率範囲', hoverinfo='skip'
        ))
        # 中央値
        fig_mc.add_trace(go.Scatter(
            x=ages, y=median_assets,
            mode='lines', name='資産中央値',
            line=dict(color='#1f77b4', width=3)
        ))
        
        # ゼロライン
        fig_mc.add_hline(y=0, line_color="red", line_width=1)
        # FIRE開始ライン
        fig_mc.add_vline(x=target_fire_age, line_width=2, line_dash="dash", line_color="orange", annotation_text="FIRE開始")
        
        fig_mc.update_layout(
            height=graph_height, # スライダーと連動
            xaxis_title="年齢", yaxis_title="資産額 (万円)",
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_mc, use_container_width=True)
        
        df_detail_export, _, _ = run_simulation(ages, None)
        st.caption("※詳細データは固定リターンの標準シナリオを表示しています。")

else:
    df_detail, is_succ, dep_age = run_simulation(ages, None)
    
    col1, col2, col3 = st.columns(3)
    fire_start_val = df_detail[df_detail["年齢"]==target_fire_age]["総資産(万円)"].values[0] if not df_detail[df_detail["年齢"]==target_fire_age].empty else 0
    final_val = df_detail.iloc[-1]["総資産(万円)"]
    
    col1.metric("FIRE開始時の資産", f"{int(fire_start_val):,} 万円")
    col2.metric("人生終了時の資産", f"{int(final_val):,} 万円")
    
    if is_succ: col3.success("🎉 資産は枯渇しません")
    else: col3.error(f"⚠️ {dep_age}歳で資産が枯渇します！")
        
    # --- Plotly Chart: Stacked Area ---
    st.subheader("資産推移 (口座別内訳・インタラクティブ)")
    
    fig_st = go.Figure()
    
    # 積み上げ面グラフ
    fig_st.add_trace(go.Scatter(
        x=ages, y=df_detail["現金(万円)"],
        mode='lines', name='現金', stackgroup='one',
        line=dict(width=0.5), fillcolor='#bcbd22'
    ))
    fig_st.add_trace(go.Scatter(
        x=ages, y=df_detail["iDeCo(万円)"],
        mode='lines', name='iDeCo', stackgroup='one',
        line=dict(width=0.5), fillcolor='#2ca02c'
    ))
    fig_st.add_trace(go.Scatter(
        x=ages, y=df_detail["NISA(万円)"],
        mode='lines', name='新NISA', stackgroup='one',
        line=dict(width=0.5), fillcolor='#ff7f0e'
    ))
    fig_st.add_trace(go.Scatter(
        x=ages, y=df_detail["特定口座(万円)"],
        mode='lines', name='特定口座', stackgroup='one',
        line=dict(width=0.5), fillcolor='#1f77b4'
    ))
    
    fig_st.add_vline(x=target_fire_age, line_width=2, line_dash="dash", line_color="red", annotation_text="FIRE開始")
    
    fig_st.update_layout(
        height=graph_height, # スライダーと連動
        xaxis_title="年齢", yaxis_title="資産額 (万円)",
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    st.plotly_chart(fig_st, use_container_width=True)
    
    df_detail_export = df_detail

csv = df_detail_export.to_csv(index=False).encode('utf-8-sig')
st.download_button(label="📥 詳細データをダウンロード", data=csv, file_name='fire_simulation_result.csv', mime='text/csv')

with st.expander("詳細データを見る"):
    st.dataframe(df_detail_export)
