#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
## Session 2 (Fork) - New Features Added (June 2026)
user_problem_statement additions:
  1. Diskon Transaksi: tombol diskon/potongan harga per transaksi di checkout (nominal Rp ATAU persen %)
  2. Hutang/Kasbon Pelanggan: catat belanja belum lunas (nama + HP + catatan), DP opsional, bayar cicil / lunasi dari tab baru "Kasbon"
  3. Kategori Barang: kelola kategori (tambah/edit/hapus) via tombol pricetags di header halaman Stok -> modal /categories

Implementation notes:
  - StoreContext: Transaction now has discount, total, status(lunas|hutang), customerName. New Debt entity (wp_debts) with payments[] for cicilan. Categories dynamic (wp_categories), addCategory/renameCategory/deleteCategory (delete moves products to "Lainnya"/fallback). Old transactions normalized on load.
  - checkout(opts: {paid, discount?, debt?}) replaces checkout(paid).
  - New tab (tabs)/hutang.tsx "Kasbon" (5 tabs now). New modal app/categories.tsx.
  - checkout.tsx: discount input (Rp/% toggle), method segmented Tunai vs Kasbon/Hutang; kasbon requires customer name, DP optional, shows Sisa Hutang.
  - receipt (screen + print HTML): shows Subtotal/Diskon/Total, and for kasbon: Pelanggan, Dibayar(DP), Sisa Kasbon, badge BELUM LUNAS.
  - laporan: gross uses tx.total (after discount); CSV has Diskon/Total/Status columns; KASBON badge in history rows.
  - This is a fully OFFLINE app - no backend testing needed. PIN: create 123456 on first launch.

## Session 2 continuation - 2 more features (to test in iteration_3):
  4. Riwayat Cicilan: in Kasbon tab, debt cards with payments show toggle "Riwayat Cicilan (n)" (testID debt-history-toggle-<id>) expanding a list (debt-history-list-<id>) of each installment: "Cicilan N · date" + "+Rp amount".
  5. Stok Masuk: in Stok tab each product row has "+ Stok" button (testID stock-restock-<id>) opening bottom-sheet modal: qty (restock-qty-input), note (restock-note-input), preview "Stok baru: X", save (restock-save) -> product qty increases + StockEntry recorded (wp_stock_entries). New header button time-outline (testID stok-history) opens /stock-history modal listing entries (name, date, note, +qty) with count/total in header, empty state stock-history-empty.

## Session 2 - Bug fixes + rename (to test in iteration_4):
  A. "Bagikan" on receipt now shares receipt as PNG IMAGE via react-native-view-shot captureRef + expo-sharing (share sheet -> WhatsApp). On web, sharing unavailable -> shows toast "Fitur bagikan hanya tersedia di aplikasi HP (Android/iOS)". Fallback to PDF share on native capture failure. Button icon now logo-whatsapp, testID receipt-share unchanged.
  B. CSV export fixed: /app/frontend/src/utils/csv.ts now branches on Platform.OS==="web" -> creates Blob + triggers browser download (a.download). Native path unchanged (File/Paths + Sharing). Used by laporan.tsx (laporan-<period>.csv) and pengaturan.tsx (data-barang.csv, testID setting-export-products). Previously ALWAYS failed on web ("Gagal mengekspor CSV" toast).
  C. App renamed to "Kasir Kita": app.json name, login.tsx brand, pengaturan.tsx footer.
