import type { Language } from "@/lib/i18n"

type LocalizedText = Record<Language, string>
type LocalizedList = Record<Language, string[]>

export type GuideBlock =
  | { type: "heading"; text: LocalizedText }
  | { type: "paragraph"; text: LocalizedText }
  | { type: "list"; items: LocalizedList }
  | { type: "code"; code: string }
  | { type: "reference"; href: string; label: LocalizedText }

export type Guide = {
  slug: string
  date: string
  title: LocalizedText
  description: LocalizedText
  blocks: GuideBlock[]
}

export const guidesCopy: Record<
  Language,
  { eyebrow: string; heading: string; intro: string; back: string; overview: string; onThisPage: string }
> = {
  ja: {
    eyebrow: "Guides",
    heading: "解説",
    intro: "LaTeX の表やグラフを作るときのコツを、テーマごとに解説します。",
    back: "使い方ガイドに戻る",
    overview: "はじめに",
    onThisPage: "このページの内容",
  },
  en: {
    eyebrow: "Guides",
    heading: "Guides",
    intro: "Topic-by-topic tips for building LaTeX tables and graphs.",
    back: "Back to getting started",
    overview: "Overview",
    onThisPage: "On this page",
  },
  zh: {
    eyebrow: "Guides",
    heading: "解说",
    intro: "按主题介绍制作 LaTeX 表格和图表的技巧。",
    back: "返回使用指南",
    overview: "概览",
    onThisPage: "本页内容",
  },
  "zh-Hant": {
    eyebrow: "Guides",
    heading: "解說",
    intro: "依主題介紹製作 LaTeX 表格與圖表的技巧。",
    back: "返回使用指南",
    overview: "概覽",
    onThisPage: "本頁內容",
  },
  es: {
    eyebrow: "Guides",
    heading: "Guías",
    intro: "Consejos por tema para crear tablas y gráficos en LaTeX.",
    back: "Volver a primeros pasos",
    overview: "Resumen",
    onThisPage: "En esta página",
  },
  de: {
    eyebrow: "Guides",
    heading: "Anleitungen",
    intro: "Themenbezogene Tipps zum Erstellen von LaTeX-Tabellen und -Diagrammen.",
    back: "Zurück zu den ersten Schritten",
    overview: "Überblick",
    onThisPage: "Auf dieser Seite",
  },
}

export const guides: Guide[] = [
  {
    slug: "excel-to-latex-table",
    date: "2026-06-16",
    title: {
      ja: "Excel の表を LaTeX の表に変換する方法",
      en: "How to convert an Excel table to a LaTeX table",
      zh: "如何将 Excel 表格转换为 LaTeX 表格",
      "zh-Hant": "如何將 Excel 表格轉換為 LaTeX 表格",
      es: "Cómo convertir una tabla de Excel en una tabla LaTeX",
      de: "So wandelst du eine Excel-Tabelle in eine LaTeX-Tabelle um",
    },
    description: {
      ja: "Excel やスプレッドシートの表を、booktabs を使った見やすい LaTeX の表に変換する手順を解説します。",
      en: "Steps for converting an Excel or spreadsheet table into a clean LaTeX table with booktabs.",
      zh: "介绍将 Excel 或电子表格表格转换为使用 booktabs 的整洁 LaTeX 表格的步骤。",
      "zh-Hant": "介紹將 Excel 或試算表表格轉換為使用 booktabs 的整潔 LaTeX 表格的步驟。",
      es: "Pasos para convertir una tabla de Excel u hoja de cálculo en una tabla LaTeX limpia con booktabs.",
      de: "Schritte zur Umwandlung einer Excel- oder Tabellenkalkulations-Tabelle in eine saubere LaTeX-Tabelle mit booktabs.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "レポートや論文で表を作るとき、Excel で整えたデータを LaTeX に手で打ち直すのは大変です。converTeXcel を使えば、表をコピーして貼り付けるだけで LaTeX の表コードが手に入ります。",
          en: "When you build a table for a report or paper, retyping data from Excel into LaTeX by hand is tedious. With converTeXcel you just copy the table and paste it to get the LaTeX table code.",
          zh: "在报告或论文中制作表格时，把 Excel 整理好的数据手动重新输入到 LaTeX 很费力。使用 converTeXcel，只需复制并粘贴表格即可获得 LaTeX 表格代码。",
          "zh-Hant": "在報告或論文中製作表格時，把 Excel 整理好的資料手動重新輸入到 LaTeX 很費力。使用 converTeXcel，只需複製並貼上表格即可取得 LaTeX 表格程式碼。",
          es: "Al crear una tabla para un informe o trabajo, volver a escribir a mano los datos de Excel en LaTeX es tedioso. Con converTeXcel solo copias la tabla y la pegas para obtener el código de la tabla LaTeX.",
          de: "Wenn du eine Tabelle für einen Bericht oder eine Arbeit erstellst, ist das erneute Abtippen der Excel-Daten in LaTeX mühsam. Mit converTeXcel kopierst du einfach die Tabelle und fügst sie ein, um den LaTeX-Tabellencode zu erhalten.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "基本の手順",
          en: "Basic steps",
          zh: "基本步骤",
          "zh-Hant": "基本步驟",
          es: "Pasos básicos",
          de: "Grundlegende Schritte",
        },
      },
      {
        type: "list",
        items: {
          ja: [
            "Excel やスプレッドシートで表を選択してコピーします。",
            "converTeXcel の入力欄に貼り付けます。",
            "出力形式で「LaTeX の表」を選びます。",
            "生成されたコードを table 環境に貼り付けます。",
          ],
          en: [
            "Select and copy the table in Excel or a spreadsheet.",
            "Paste it into the converTeXcel input area.",
            "Choose \"LaTeX table\" as the output format.",
            "Paste the generated code into a table environment.",
          ],
          zh: [
            "在 Excel 或电子表格中选择并复制表格。",
            "粘贴到 converTeXcel 的输入区。",
            "在输出格式中选择“LaTeX 表格”。",
            "将生成的代码粘贴到 table 环境中。",
          ],
          "zh-Hant": [
            "在 Excel 或試算表中選擇並複製表格。",
            "貼上到 converTeXcel 的輸入區。",
            "在輸出格式中選擇「LaTeX 表格」。",
            "將生成的程式碼貼上到 table 環境中。",
          ],
          es: [
            "Selecciona y copia la tabla en Excel o una hoja de cálculo.",
            "Pégala en el área de entrada de converTeXcel.",
            "Elige \"tabla LaTeX\" como formato de salida.",
            "Pega el código generado en un entorno table.",
          ],
          de: [
            "Wähle und kopiere die Tabelle in Excel oder einer Tabellenkalkulation.",
            "Füge sie in den Eingabebereich von converTeXcel ein.",
            "Wähle \"LaTeX-Tabelle\" als Ausgabeformat.",
            "Füge den erzeugten Code in eine table-Umgebung ein.",
          ],
        },
      },
      {
        type: "heading",
        text: {
          ja: "booktabs できれいな罫線にする",
          en: "Clean rules with booktabs",
          zh: "用 booktabs 制作整洁的横线",
          "zh-Hant": "用 booktabs 製作整潔的橫線",
          es: "Líneas limpias con booktabs",
          de: "Saubere Linien mit booktabs",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "LaTeX の表は、縦線を多用するよりも booktabs パッケージの横罫線（\\toprule, \\midrule, \\bottomrule）を使うと読みやすくなります。converTeXcel は booktabs 形式の出力に対応しています。プリアンブルに次の1行を追加してください。",
          en: "LaTeX tables read better with the horizontal rules of the booktabs package (\\toprule, \\midrule, \\bottomrule) than with many vertical lines. converTeXcel supports booktabs output. Add this line to your preamble.",
          zh: "LaTeX 表格使用 booktabs 宏包的横线（\\toprule、\\midrule、\\bottomrule）比大量竖线更易读。converTeXcel 支持 booktabs 格式输出。请在导言区添加以下一行。",
          "zh-Hant": "LaTeX 表格使用 booktabs 套件的橫線（\\toprule、\\midrule、\\bottomrule）比大量豎線更易讀。converTeXcel 支援 booktabs 格式輸出。請在前導區加入以下一行。",
          es: "Las tablas LaTeX se leen mejor con las líneas horizontales del paquete booktabs (\\toprule, \\midrule, \\bottomrule) que con muchas líneas verticales. converTeXcel admite la salida con booktabs. Añade esta línea al preámbulo.",
          de: "LaTeX-Tabellen lesen sich mit den horizontalen Linien des booktabs-Pakets (\\toprule, \\midrule, \\bottomrule) besser als mit vielen vertikalen Linien. converTeXcel unterstützt die booktabs-Ausgabe. Füge diese Zeile in deine Präambel ein.",
        },
      },
      { type: "code", code: "\\usepackage{booktabs}" },
      {
        type: "paragraph",
        text: {
          ja: "出力は次のような形になります。",
          en: "The output looks like this.",
          zh: "输出形式如下。",
          "zh-Hant": "輸出形式如下。",
          es: "La salida tiene este aspecto.",
          de: "Die Ausgabe sieht so aus.",
        },
      },
      {
        type: "code",
        code: [
          "\\begin{table}[htbp]",
          "  \\centering",
          "  \\caption{Measurement results}",
          "  \\begin{tabular}{lcc}",
          "    \\toprule",
          "    Sample & Mass [g] & Volume [cm$^3$] \\\\",
          "    \\midrule",
          "    A & 12.3 & 4.5 \\\\",
          "    B & 23.1 & 5.2 \\\\",
          "    \\bottomrule",
          "  \\end{tabular}",
          "\\end{table}",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "うまくいかないときは",
          en: "If something goes wrong",
          zh: "遇到问题时",
          "zh-Hant": "遇到問題時",
          es: "Si algo sale mal",
          de: "Wenn etwas schiefgeht",
        },
      },
      {
        type: "list",
        items: {
          ja: [
            "列がずれる場合は、貼り付けたデータがタブ区切りになっているか確認してください。",
            "セル内のカンマが区切りと誤認される場合は、入力設定で区切り文字を切り替えます。",
            "プレビューで崩れて見えるときは、空のセルや結合セルが含まれていないか確認します。",
          ],
          en: [
            "If columns are misaligned, check that the pasted data is tab-separated.",
            "If commas inside cells are mistaken for separators, switch the delimiter in the input settings.",
            "If the preview looks broken, check for empty or merged cells.",
          ],
          zh: [
            "如果列错位，请检查粘贴的数据是否以制表符分隔。",
            "如果单元格内的逗号被误认为分隔符，请在输入设置中切换分隔符。",
            "如果预览显示错乱，请检查是否包含空单元格或合并单元格。",
          ],
          "zh-Hant": [
            "如果欄位錯位，請檢查貼上的資料是否以 Tab 分隔。",
            "如果儲存格內的逗號被誤認為分隔符，請在輸入設定中切換分隔符。",
            "如果預覽顯示錯亂，請檢查是否包含空儲存格或合併儲存格。",
          ],
          es: [
            "Si las columnas se desalinean, comprueba que los datos pegados estén separados por tabuladores.",
            "Si las comas dentro de las celdas se confunden con separadores, cambia el delimitador en los ajustes de entrada.",
            "Si la vista previa se ve mal, comprueba si hay celdas vacías o combinadas.",
          ],
          de: [
            "Wenn Spalten verrutschen, prüfe, ob die eingefügten Daten tabulatorgetrennt sind.",
            "Wenn Kommas in Zellen als Trenner missverstanden werden, ändere das Trennzeichen in den Eingabeeinstellungen.",
            "Wenn die Vorschau fehlerhaft aussieht, prüfe auf leere oder verbundene Zellen.",
          ],
        },
      },
    ],
  },
  {
    slug: "siunitx-numbers-units",
    date: "2026-06-16",
    title: {
      ja: "siunitx で数値と単位をきれいに揃える",
      en: "Aligning numbers and units cleanly with siunitx",
      zh: "用 siunitx 整齐地对齐数值与单位",
      "zh-Hant": "用 siunitx 整齊地對齊數值與單位",
      es: "Alinear números y unidades de forma clara con siunitx",
      de: "Zahlen und Einheiten sauber ausrichten mit siunitx",
    },
    description: {
      ja: "siunitx を使って、有効数字や単位、小数点の位置をそろえた美しい数値表現にする方法を解説します。",
      en: "How to use siunitx to align significant figures, units, and decimal points for clean numeric tables.",
      zh: "介绍如何使用 siunitx 对齐有效数字、单位和小数点，制作整洁的数值表格。",
      "zh-Hant": "介紹如何使用 siunitx 對齊有效數字、單位與小數點，製作整潔的數值表格。",
      es: "Cómo usar siunitx para alinear cifras significativas, unidades y puntos decimales en tablas numéricas limpias.",
      de: "Wie man siunitx verwendet, um signifikante Stellen, Einheiten und Dezimalpunkte für saubere Zahlentabellen auszurichten.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "測定値を表に並べると、小数点の位置がバラバラで読みにくくなりがちです。siunitx パッケージを使うと、数値を小数点でそろえ、単位も正しく組版できます。",
          en: "When you line up measured values in a table, the decimal points often end up misaligned and hard to read. The siunitx package aligns numbers on the decimal point and typesets units correctly.",
          zh: "把测量值排列在表格中时，小数点位置常常参差不齐，难以阅读。siunitx 宏包可以让数值按小数点对齐，并正确排版单位。",
          "zh-Hant": "把測量值排列在表格中時，小數點位置常常參差不齊，難以閱讀。siunitx 套件可以讓數值按小數點對齊，並正確排版單位。",
          es: "Cuando alineas valores medidos en una tabla, los puntos decimales suelen quedar desalineados y difíciles de leer. El paquete siunitx alinea los números por el punto decimal y compone las unidades correctamente.",
          de: "Wenn du Messwerte in einer Tabelle auflistest, sind die Dezimalpunkte oft nicht ausgerichtet und schwer lesbar. Das siunitx-Paket richtet Zahlen am Dezimalpunkt aus und setzt Einheiten korrekt.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "siunitx の準備",
          en: "Setting up siunitx",
          zh: "准备 siunitx",
          "zh-Hant": "準備 siunitx",
          es: "Preparar siunitx",
          de: "siunitx einrichten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "プリアンブルに次を追加します。",
          en: "Add the following to your preamble.",
          zh: "在导言区添加以下内容。",
          "zh-Hant": "在前導區加入以下內容。",
          es: "Añade lo siguiente al preámbulo.",
          de: "Füge Folgendes in deine Präambel ein.",
        },
      },
      { type: "code", code: "\\usepackage{siunitx}" },
      {
        type: "heading",
        text: {
          ja: "数値を小数点でそろえる",
          en: "Align numbers on the decimal point",
          zh: "按小数点对齐数值",
          "zh-Hant": "按小數點對齊數值",
          es: "Alinear números por el punto decimal",
          de: "Zahlen am Dezimalpunkt ausrichten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "列指定で S 列を使うと、その列の数値が小数点でそろいます。converTeXcel で siunitx を有効にすると、数値列が自動的に S 列として出力されます。",
          en: "Using an S column in the column spec aligns that column's numbers on the decimal point. When you enable siunitx in converTeXcel, numeric columns are output as S columns automatically.",
          zh: "在列格式中使用 S 列，可让该列的数值按小数点对齐。在 converTeXcel 中启用 siunitx 后，数值列会自动输出为 S 列。",
          "zh-Hant": "在欄格式中使用 S 欄，可讓該欄的數值按小數點對齊。在 converTeXcel 中啟用 siunitx 後，數值欄會自動輸出為 S 欄。",
          es: "Usar una columna S en la especificación de columnas alinea los números de esa columna por el punto decimal. Al activar siunitx en converTeXcel, las columnas numéricas se generan como columnas S automáticamente.",
          de: "Eine S-Spalte in der Spaltenangabe richtet die Zahlen dieser Spalte am Dezimalpunkt aus. Wenn du siunitx in converTeXcel aktivierst, werden numerische Spalten automatisch als S-Spalten ausgegeben.",
        },
      },
      {
        type: "code",
        code: [
          "\\begin{tabular}{l S S}",
          "  \\toprule",
          "  {Sample} & {Mass [\\si{\\gram}]} & {Volume [\\si{\\cubic\\centi\\meter}]} \\\\",
          "  \\midrule",
          "  A & 12.3 & 4.5 \\\\",
          "  B & 123.0 & 5.25 \\\\",
          "  \\bottomrule",
          "\\end{tabular}",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "有効数字をそろえる",
          en: "Match significant figures",
          zh: "对齐有效数字",
          "zh-Hant": "對齊有效數字",
          es: "Igualar las cifras significativas",
          de: "Signifikante Stellen angleichen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "converTeXcel では有効数字をドロップダウンで選べます。選んだ桁数に合わせて数値が整形されるので、表全体の桁をそろえられます。",
          en: "converTeXcel lets you pick significant figures from a dropdown. Numbers are formatted to the chosen precision, so the whole table shares a consistent number of digits.",
          zh: "converTeXcel 可以通过下拉菜单选择有效数字。数值会按所选位数进行格式化，因此整个表格的位数保持一致。",
          "zh-Hant": "converTeXcel 可以透過下拉選單選擇有效數字。數值會按所選位數進行格式化，因此整個表格的位數保持一致。",
          es: "converTeXcel te permite elegir las cifras significativas en un menú desplegable. Los números se formatean con la precisión elegida, por lo que toda la tabla comparte la misma cantidad de dígitos.",
          de: "Mit converTeXcel wählst du die signifikanten Stellen über ein Dropdown. Zahlen werden auf die gewählte Genauigkeit formatiert, sodass die ganze Tabelle einheitlich viele Stellen hat.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "単位の書き方",
          en: "Writing units",
          zh: "单位的写法",
          "zh-Hant": "單位的寫法",
          es: "Escribir unidades",
          de: "Einheiten schreiben",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "単位は \\si{...} で書きます。数値と単位をまとめて書くときは \\SI{...}{...} を使います。たとえば次は 9.8 m/s² になります。",
          en: "Write units with \\si{...}. To write a number together with its unit, use \\SI{...}{...}. For example, the following produces 9.8 m/s².",
          zh: "单位用 \\si{...} 书写。要把数值和单位写在一起时使用 \\SI{...}{...}。例如下面会得到 9.8 m/s²。",
          "zh-Hant": "單位用 \\si{...} 書寫。要把數值和單位寫在一起時使用 \\SI{...}{...}。例如下面會得到 9.8 m/s²。",
          es: "Escribe las unidades con \\si{...}. Para escribir un número junto con su unidad, usa \\SI{...}{...}. Por ejemplo, lo siguiente produce 9,8 m/s².",
          de: "Schreibe Einheiten mit \\si{...}. Um eine Zahl zusammen mit ihrer Einheit zu schreiben, verwende \\SI{...}{...}. Das Folgende ergibt zum Beispiel 9,8 m/s².",
        },
      },
      { type: "code", code: "\\SI{9.8}{\\meter\\per\\second\\squared}" },
    ],
  },
  {
    slug: "graphs-from-data",
    date: "2026-06-16",
    title: {
      ja: "測定データからグラフを作る（gnuplot と PGFPlots）",
      en: "Making graphs from data (gnuplot and PGFPlots)",
      zh: "从测量数据制作图表（gnuplot 和 PGFPlots）",
      "zh-Hant": "從測量資料製作圖表（gnuplot 與 PGFPlots）",
      es: "Crear gráficos a partir de datos (gnuplot y PGFPlots)",
      de: "Diagramme aus Daten erstellen (gnuplot und PGFPlots)",
    },
    description: {
      ja: "測定データからグラフを生成し、ブラウザでプレビューしてからレポートに貼り付ける方法を解説します。",
      en: "How to generate graphs from measurement data, preview them in the browser, and paste them into your report.",
      zh: "介绍如何从测量数据生成图表，在浏览器中预览后再粘贴到报告中。",
      "zh-Hant": "介紹如何從測量資料生成圖表，在瀏覽器中預覽後再貼上到報告中。",
      es: "Cómo generar gráficos a partir de datos de medición, previsualizarlos en el navegador y pegarlos en tu informe.",
      de: "Wie man Diagramme aus Messdaten erzeugt, im Browser anzeigt und in den Bericht einfügt.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "実験レポートでは、測定データの散布図や近似直線をグラフにすることがよくあります。converTeXcel は、貼り付けたデータから gnuplot スクリプトや PGFPlots のコードを生成し、ブラウザ上でグラフをプレビューできます。",
          en: "Lab reports often need scatter plots or fitted lines from measured data. converTeXcel generates gnuplot scripts or PGFPlots code from pasted data and previews the graph in the browser.",
          zh: "实验报告中经常需要根据测量数据绘制散点图或拟合直线。converTeXcel 可以从粘贴的数据生成 gnuplot 脚本或 PGFPlots 代码，并在浏览器中预览图表。",
          "zh-Hant": "實驗報告中經常需要根據測量資料繪製散佈圖或擬合直線。converTeXcel 可以從貼上的資料生成 gnuplot 指令稿或 PGFPlots 程式碼，並在瀏覽器中預覽圖表。",
          es: "Los informes de laboratorio suelen necesitar diagramas de dispersión o rectas de ajuste a partir de datos medidos. converTeXcel genera scripts de gnuplot o código de PGFPlots a partir de los datos pegados y previsualiza el gráfico en el navegador.",
          de: "Laborberichte benötigen oft Streudiagramme oder Ausgleichsgeraden aus Messdaten. converTeXcel erzeugt gnuplot-Skripte oder PGFPlots-Code aus eingefügten Daten und zeigt das Diagramm im Browser an.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "データを用意する",
          en: "Prepare the data",
          zh: "准备数据",
          "zh-Hant": "準備資料",
          es: "Prepara los datos",
          de: "Daten vorbereiten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "1列目を x、2列目以降を y として、数値の表を貼り付けます。ヘッダー行があっても自動で判別します。",
          en: "Paste a table of numbers with the first column as x and the remaining columns as y. A header row is detected automatically.",
          zh: "粘贴数值表格，第一列作为 x，其余列作为 y。即使有表头行也会自动识别。",
          "zh-Hant": "貼上數值表格，第一欄作為 x，其餘欄作為 y。即使有表頭列也會自動辨識。",
          es: "Pega una tabla de números con la primera columna como x y las demás como y. Una fila de encabezado se detecta automáticamente.",
          de: "Füge eine Zahlentabelle ein, wobei die erste Spalte x und die übrigen y sind. Eine Kopfzeile wird automatisch erkannt.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "gnuplot でプレビューする",
          en: "Preview with gnuplot",
          zh: "用 gnuplot 预览",
          "zh-Hant": "用 gnuplot 預覽",
          es: "Previsualizar con gnuplot",
          de: "Mit gnuplot ansehen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "出力形式で gnuplot を選ぶと、スクリプトが生成され、その場でグラフが描画されます。軸ラベルや凡例を確認しながら調整できます。",
          en: "Choosing gnuplot as the output format generates a script and renders the graph on the spot, so you can adjust axis labels and the legend while checking the result.",
          zh: "在输出格式中选择 gnuplot，会生成脚本并就地绘制图表，让你可以一边查看一边调整坐标轴标签和图例。",
          "zh-Hant": "在輸出格式中選擇 gnuplot，會生成指令稿並就地繪製圖表，讓你可以一邊查看一邊調整座標軸標籤和圖例。",
          es: "Elegir gnuplot como formato de salida genera un script y dibuja el gráfico al instante, para que ajustes las etiquetas de los ejes y la leyenda mientras revisas el resultado.",
          de: "Wenn du gnuplot als Ausgabeformat wählst, wird ein Skript erzeugt und das Diagramm sofort gezeichnet, sodass du Achsenbeschriftungen und Legende beim Prüfen anpassen kannst.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "PGFPlots で LaTeX に埋め込む",
          en: "Embed in LaTeX with PGFPlots",
          zh: "用 PGFPlots 嵌入 LaTeX",
          "zh-Hant": "用 PGFPlots 嵌入 LaTeX",
          es: "Incrustar en LaTeX con PGFPlots",
          de: "Mit PGFPlots in LaTeX einbetten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "LaTeX の文書にそのまま埋め込みたい場合は、TikZ/PGFPlots 形式を選びます。プリアンブルに次を追加してください。",
          en: "To embed the graph directly in a LaTeX document, choose the TikZ/PGFPlots format. Add the following to your preamble.",
          zh: "若想直接嵌入到 LaTeX 文档中，请选择 TikZ/PGFPlots 格式。在导言区添加以下内容。",
          "zh-Hant": "若想直接嵌入到 LaTeX 文件中，請選擇 TikZ/PGFPlots 格式。在前導區加入以下內容。",
          es: "Para incrustar el gráfico directamente en un documento LaTeX, elige el formato TikZ/PGFPlots. Añade lo siguiente al preámbulo.",
          de: "Um das Diagramm direkt in ein LaTeX-Dokument einzubetten, wähle das TikZ/PGFPlots-Format. Füge Folgendes in deine Präambel ein.",
        },
      },
      { type: "code", code: "\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}" },
      {
        type: "paragraph",
        text: {
          ja: "生成されるコードは tikzpicture 環境で構成され、figure 環境に入れて使います。",
          en: "The generated code is built from a tikzpicture environment, which you place inside a figure environment.",
          zh: "生成的代码由 tikzpicture 环境构成，放入 figure 环境中使用。",
          "zh-Hant": "生成的程式碼由 tikzpicture 環境構成，放入 figure 環境中使用。",
          es: "El código generado se construye con un entorno tikzpicture, que colocas dentro de un entorno figure.",
          de: "Der erzeugte Code basiert auf einer tikzpicture-Umgebung, die du in eine figure-Umgebung einfügst.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "近似直線を引く",
          en: "Add a trend line",
          zh: "添加拟合直线",
          "zh-Hant": "添加擬合直線",
          es: "Añadir una recta de ajuste",
          de: "Eine Ausgleichsgerade hinzufügen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "最小二乗法による近似直線は、gnuplot なら fit、PGFPlots なら近似のオプションで引けます。データの傾向を確認したり、傾きから物理量を求めたりするのに便利です。",
          en: "A least-squares trend line can be drawn with fit in gnuplot or a regression option in PGFPlots. It's handy for checking the trend or reading a physical quantity from the slope.",
          zh: "最小二乘拟合直线在 gnuplot 中可用 fit，在 PGFPlots 中可用回归选项绘制。便于查看数据趋势或从斜率求物理量。",
          "zh-Hant": "最小平方擬合直線在 gnuplot 中可用 fit，在 PGFPlots 中可用迴歸選項繪製。便於查看資料趨勢或從斜率求物理量。",
          es: "Una recta de ajuste por mínimos cuadrados se puede trazar con fit en gnuplot o una opción de regresión en PGFPlots. Es útil para ver la tendencia o leer una magnitud física a partir de la pendiente.",
          de: "Eine Ausgleichsgerade nach kleinsten Quadraten lässt sich mit fit in gnuplot oder einer Regressionsoption in PGFPlots zeichnen. Praktisch, um den Trend zu prüfen oder eine physikalische Größe aus der Steigung abzulesen.",
        },
      },
    ],
  },
  {
    slug: "pgfplots-basics",
    date: "2026-06-16",
    title: {
      ja: "pgfplots で最初のグラフを描く",
      en: "Drawing your first graph with pgfplots",
      zh: "用 pgfplots 绘制第一张图表",
      "zh-Hant": "用 pgfplots 繪製第一張圖表",
      es: "Dibujar tu primer gráfico con pgfplots",
      de: "Dein erstes Diagramm mit pgfplots zeichnen",
    },
    description: {
      ja: "pgfplots の axis 環境と \\addplot で、散布図や折れ線グラフを描く基本を解説します。",
      en: "The basics of drawing scatter and line plots with the pgfplots axis environment and \\addplot.",
      zh: "介绍使用 pgfplots 的 axis 环境和 \\addplot 绘制散点图和折线图的基础。",
      "zh-Hant": "介紹使用 pgfplots 的 axis 環境和 \\addplot 繪製散佈圖和折線圖的基礎。",
      es: "Los fundamentos para dibujar diagramas de dispersión y de líneas con el entorno axis de pgfplots y \\addplot.",
      de: "Die Grundlagen zum Zeichnen von Streu- und Liniendiagrammen mit der pgfplots-axis-Umgebung und \\addplot.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "pgfplots は LaTeX の中でグラフを描くためのパッケージです。外部の画像を貼らずに、本文と同じフォントでグラフを作れるのが利点です。まずは最小限の例から始めましょう。",
          en: "pgfplots is a package for drawing graphs inside LaTeX. Its advantage is that you build graphs in the same font as your text, without pasting external images. Let's start with a minimal example.",
          zh: "pgfplots 是一个在 LaTeX 中绘制图表的宏包。它的优点是无需粘贴外部图片，就能用与正文相同的字体绘制图表。先从一个最简单的例子开始。",
          "zh-Hant": "pgfplots 是一個在 LaTeX 中繪製圖表的套件。它的優點是無需貼上外部圖片，就能用與正文相同的字型繪製圖表。先從一個最簡單的例子開始。",
          es: "pgfplots es un paquete para dibujar gráficos dentro de LaTeX. Su ventaja es que construyes los gráficos con la misma tipografía que el texto, sin pegar imágenes externas. Empecemos con un ejemplo mínimo.",
          de: "pgfplots ist ein Paket zum Zeichnen von Diagrammen direkt in LaTeX. Sein Vorteil: Du erstellst Diagramme in derselben Schrift wie dein Text, ohne externe Bilder einzufügen. Beginnen wir mit einem minimalen Beispiel.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "準備",
          en: "Setup",
          zh: "准备",
          "zh-Hant": "準備",
          es: "Preparación",
          de: "Einrichtung",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "プリアンブルに次を追加します。compat の指定で挙動のバージョンを固定でき、将来 pgfplots が更新されても見た目が変わりにくくなります。",
          en: "Add the following to your preamble. Setting compat pins the behavior to a version, so the appearance stays stable even if pgfplots is updated later.",
          zh: "在导言区添加以下内容。指定 compat 可将行为固定到某个版本，即使日后 pgfplots 更新，外观也不易改变。",
          "zh-Hant": "在前導區加入以下內容。指定 compat 可將行為固定到某個版本，即使日後 pgfplots 更新，外觀也不易改變。",
          es: "Añade lo siguiente al preámbulo. Definir compat fija el comportamiento a una versión, de modo que la apariencia se mantiene estable aunque pgfplots se actualice más tarde.",
          de: "Füge Folgendes in deine Präambel ein. Das Setzen von compat fixiert das Verhalten auf eine Version, sodass das Aussehen stabil bleibt, selbst wenn pgfplots später aktualisiert wird.",
        },
      },
      { type: "code", code: "\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.18}" },
      {
        type: "heading",
        text: {
          ja: "最小の散布図",
          en: "A minimal scatter plot",
          zh: "最简单的散点图",
          "zh-Hant": "最簡單的散佈圖",
          es: "Un diagrama de dispersión mínimo",
          de: "Ein minimales Streudiagramm",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "axis 環境の中に \\addplot で座標を並べます。only marks を付けると、点だけのプロット（散布図）になります。",
          en: "Inside the axis environment, list coordinates with \\addplot. Adding only marks gives a points-only plot (a scatter plot).",
          zh: "在 axis 环境中用 \\addplot 列出坐标。加上 only marks 就得到只有点的图（散点图）。",
          "zh-Hant": "在 axis 環境中用 \\addplot 列出座標。加上 only marks 就得到只有點的圖（散佈圖）。",
          es: "Dentro del entorno axis, enumera las coordenadas con \\addplot. Añadir only marks da un gráfico solo de puntos (un diagrama de dispersión).",
          de: "Liste innerhalb der axis-Umgebung die Koordinaten mit \\addplot auf. Mit only marks erhältst du eine reine Punktdarstellung (ein Streudiagramm).",
        },
      },
      {
        type: "code",
        code: [
          "\\begin{tikzpicture}",
          "\\begin{axis}",
          "  \\addplot[only marks] coordinates {",
          "    (1, 2.3) (2, 3.1) (3, 4.8) (4, 5.9)",
          "  };",
          "\\end{axis}",
          "\\end{tikzpicture}",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "折れ線にする",
          en: "Make it a line",
          zh: "改为折线",
          "zh-Hant": "改為折線",
          es: "Convertirlo en línea",
          de: "Als Linie darstellen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "only marks を外すと点が線で結ばれます。mark=* を付ければ、線とマーカーの両方を表示できます。",
          en: "Remove only marks and the points are connected by a line. Add mark=* to show both the line and the markers.",
          zh: "去掉 only marks，点就会用线连接起来。加上 mark=* 可同时显示线和标记。",
          "zh-Hant": "去掉 only marks，點就會用線連接起來。加上 mark=* 可同時顯示線和標記。",
          es: "Quita only marks y los puntos se conectan con una línea. Añade mark=* para mostrar tanto la línea como los marcadores.",
          de: "Entferne only marks, und die Punkte werden durch eine Linie verbunden. Füge mark=* hinzu, um sowohl Linie als auch Marker zu zeigen.",
        },
      },
      {
        type: "code",
        code: [
          "\\addplot[mark=*] coordinates {",
          "  (1, 2.3) (2, 3.1) (3, 4.8) (4, 5.9)",
          "};",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "figure 環境に入れる",
          en: "Place it in a figure",
          zh: "放入 figure 环境",
          "zh-Hant": "放入 figure 環境",
          es: "Colocarlo en un figure",
          de: "In eine figure-Umgebung einfügen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "本文に載せるときは figure 環境で囲み、キャプションとラベルを付けます。converTeXcel の TikZ/PGFPlots 出力も、この形のコードを生成します。",
          en: "To include it in your document, wrap it in a figure environment with a caption and label. converTeXcel's TikZ/PGFPlots output also produces code in this shape.",
          zh: "要放入文档时，用 figure 环境包裹并加上标题和标签。converTeXcel 的 TikZ/PGFPlots 输出也会生成这种形式的代码。",
          "zh-Hant": "要放入文件時，用 figure 環境包裹並加上標題和標籤。converTeXcel 的 TikZ/PGFPlots 輸出也會生成這種形式的程式碼。",
          es: "Para incluirlo en tu documento, envuélvelo en un entorno figure con un pie y una etiqueta. La salida TikZ/PGFPlots de converTeXcel también genera código con esta forma.",
          de: "Um es in dein Dokument aufzunehmen, umschließe es mit einer figure-Umgebung samt Beschriftung und Label. Die TikZ/PGFPlots-Ausgabe von converTeXcel erzeugt ebenfalls Code in dieser Form.",
        },
      },
      {
        type: "reference",
        href: "https://ctan.org/pkg/pgfplots",
        label: {
          ja: "公式マニュアル（pgfplots, CTAN）",
          en: "Official manual (pgfplots, CTAN)",
          zh: "官方手册（pgfplots, CTAN）",
          "zh-Hant": "官方手冊（pgfplots, CTAN）",
          es: "Manual oficial (pgfplots, CTAN)",
          de: "Offizielles Handbuch (pgfplots, CTAN)",
        },
      },
    ],
  },
  {
    slug: "pgfplots-error-bars",
    date: "2026-06-16",
    title: {
      ja: "pgfplots で誤差棒（エラーバー）を描く",
      en: "Drawing error bars with pgfplots",
      zh: "用 pgfplots 绘制误差棒",
      "zh-Hant": "用 pgfplots 繪製誤差棒",
      es: "Dibujar barras de error con pgfplots",
      de: "Fehlerbalken mit pgfplots zeichnen",
    },
    description: {
      ja: "実験データの誤差を表す誤差棒を pgfplots で描く方法を解説します。",
      en: "How to draw error bars that show the uncertainty of experimental data with pgfplots.",
      zh: "介绍如何用 pgfplots 绘制表示实验数据误差的误差棒。",
      "zh-Hant": "介紹如何用 pgfplots 繪製表示實驗資料誤差的誤差棒。",
      es: "Cómo dibujar barras de error que muestran la incertidumbre de datos experimentales con pgfplots.",
      de: "Wie man mit pgfplots Fehlerbalken zeichnet, die die Unsicherheit experimenteller Daten zeigen.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "測定値には誤差がつきものです。pgfplots では各点に誤差棒を付けて、ばらつきや不確かさを視覚的に示せます。",
          en: "Measured values always carry uncertainty. With pgfplots you can attach error bars to each point to show scatter and uncertainty visually.",
          zh: "测量值总是带有误差。在 pgfplots 中，你可以为每个点添加误差棒，直观地表示离散度和不确定度。",
          "zh-Hant": "測量值總是帶有誤差。在 pgfplots 中，你可以為每個點添加誤差棒，直觀地表示離散度和不確定度。",
          es: "Los valores medidos siempre tienen incertidumbre. Con pgfplots puedes añadir barras de error a cada punto para mostrar la dispersión y la incertidumbre visualmente.",
          de: "Messwerte sind immer mit Unsicherheit behaftet. Mit pgfplots kannst du an jeden Punkt Fehlerbalken anbringen, um Streuung und Unsicherheit sichtbar zu machen.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "誤差棒を有効にする",
          en: "Enable error bars",
          zh: "启用误差棒",
          "zh-Hant": "啟用誤差棒",
          es: "Activar las barras de error",
          de: "Fehlerbalken aktivieren",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "\\addplot のオプションで error bars を有効にし、どの方向に誤差を表示するかを指定します。次は y 方向の誤差棒の例で、各点に +- (dx, dy) の形で誤差を与えます。",
          en: "Enable error bars in the \\addplot options and specify which direction to show them. The example below shows y-direction error bars, giving each point its error as +- (dx, dy).",
          zh: "在 \\addplot 选项中启用 error bars，并指定误差显示的方向。下面是 y 方向误差棒的例子，每个点以 +- (dx, dy) 的形式给出误差。",
          "zh-Hant": "在 \\addplot 選項中啟用 error bars，並指定誤差顯示的方向。下面是 y 方向誤差棒的例子，每個點以 +- (dx, dy) 的形式給出誤差。",
          es: "Activa error bars en las opciones de \\addplot e indica en qué dirección mostrarlas. El ejemplo siguiente muestra barras de error en la dirección y, dando a cada punto su error como +- (dx, dy).",
          de: "Aktiviere error bars in den \\addplot-Optionen und gib an, in welche Richtung sie angezeigt werden. Das folgende Beispiel zeigt Fehlerbalken in y-Richtung und gibt jedem Punkt seinen Fehler als +- (dx, dy) an.",
        },
      },
      {
        type: "code",
        code: [
          "\\addplot[",
          "  only marks,",
          "  error bars/.cd, y dir=both, y explicit,",
          "] coordinates {",
          "  (1, 2.3) +- (0, 0.2)",
          "  (2, 3.1) +- (0, 0.3)",
          "  (3, 4.8) +- (0, 0.25)",
          "};",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "x 方向にも付ける",
          en: "Add x-direction bars too",
          zh: "也添加 x 方向",
          "zh-Hant": "也添加 x 方向",
          es: "Añadir también en la dirección x",
          de: "Auch in x-Richtung hinzufügen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "x 方向にも誤差がある場合は x dir=both, x explicit を加え、各点に (dx, dy) の両方を与えます。",
          en: "If there is error in the x direction too, add x dir=both, x explicit and give each point both (dx, dy).",
          zh: "如果 x 方向也有误差，添加 x dir=both, x explicit，并为每个点同时给出 (dx, dy)。",
          "zh-Hant": "如果 x 方向也有誤差，添加 x dir=both, x explicit，並為每個點同時給出 (dx, dy)。",
          es: "Si también hay error en la dirección x, añade x dir=both, x explicit y da a cada punto ambos (dx, dy).",
          de: "Gibt es auch in x-Richtung einen Fehler, füge x dir=both, x explicit hinzu und gib jedem Punkt beide (dx, dy).",
        },
      },
      {
        type: "code",
        code: [
          "\\addplot[",
          "  only marks,",
          "  error bars/.cd,",
          "  x dir=both, x explicit,",
          "  y dir=both, y explicit,",
          "] coordinates {",
          "  (1, 2.3) +- (0.1, 0.2)",
          "};",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "誤差棒の見た目を整える",
          en: "Style the error bars",
          zh: "调整误差棒的外观",
          "zh-Hant": "調整誤差棒的外觀",
          es: "Dar estilo a las barras de error",
          de: "Fehlerbalken gestalten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "error bar style で線の色や太さを変えられます。マーカーが誤差棒に埋もれないよう太さを調整すると、見やすくなります。",
          en: "Use error bar style to change the color and thickness of the bars. Adjusting the thickness so the markers aren't lost in the bars makes the plot easier to read.",
          zh: "用 error bar style 可以改变线的颜色和粗细。调整粗细让标记不被误差棒淹没，会更易读。",
          "zh-Hant": "用 error bar style 可以改變線的顏色和粗細。調整粗細讓標記不被誤差棒淹沒，會更易讀。",
          es: "Usa error bar style para cambiar el color y el grosor de las barras. Ajustar el grosor para que los marcadores no se pierdan entre las barras hace que el gráfico sea más legible.",
          de: "Mit error bar style änderst du Farbe und Dicke der Balken. Wenn du die Dicke so anpasst, dass die Marker nicht in den Balken untergehen, wird das Diagramm lesbarer.",
        },
      },
      {
        type: "reference",
        href: "https://ctan.org/pkg/pgfplots",
        label: {
          ja: "公式マニュアル（pgfplots, CTAN）",
          en: "Official manual (pgfplots, CTAN)",
          zh: "官方手册（pgfplots, CTAN）",
          "zh-Hant": "官方手冊（pgfplots, CTAN）",
          es: "Manual oficial (pgfplots, CTAN)",
          de: "Offizielles Handbuch (pgfplots, CTAN)",
        },
      },
    ],
  },
  {
    slug: "pgfplots-from-csv",
    date: "2026-06-16",
    title: {
      ja: "CSV/外部データから pgfplots でグラフを描く",
      en: "Plotting from CSV or external data with pgfplots",
      zh: "用 pgfplots 从 CSV/外部数据绘图",
      "zh-Hant": "用 pgfplots 從 CSV/外部資料繪圖",
      es: "Graficar desde CSV o datos externos con pgfplots",
      de: "Aus CSV oder externen Daten mit pgfplots zeichnen",
    },
    description: {
      ja: "\\addplot table を使って、CSV などの外部データファイルから直接グラフを描く方法を解説します。",
      en: "How to plot directly from external data files such as CSV using \\addplot table.",
      zh: "介绍如何使用 \\addplot table 直接从 CSV 等外部数据文件绘图。",
      "zh-Hant": "介紹如何使用 \\addplot table 直接從 CSV 等外部資料檔案繪圖。",
      es: "Cómo graficar directamente desde archivos de datos externos como CSV usando \\addplot table.",
      de: "Wie man mit \\addplot table direkt aus externen Datendateien wie CSV zeichnet.",
    },
    blocks: [
      {
        type: "paragraph",
        text: {
          ja: "データ点が多いとき、座標を1つずつ書くのは大変です。pgfplots は CSV やスペース区切りのデータファイルを直接読み込めます。converTeXcel で CSV を書き出してから読み込む流れも便利です。",
          en: "When you have many data points, writing coordinates one by one is tedious. pgfplots can read CSV or space-separated data files directly. Exporting CSV from converTeXcel and reading it in is a handy workflow.",
          zh: "当数据点很多时，逐个写坐标很麻烦。pgfplots 可以直接读取 CSV 或以空格分隔的数据文件。用 converTeXcel 导出 CSV 后再读取，也是很方便的流程。",
          "zh-Hant": "當資料點很多時，逐個寫座標很麻煩。pgfplots 可以直接讀取 CSV 或以空格分隔的資料檔案。用 converTeXcel 匯出 CSV 後再讀取，也是很方便的流程。",
          es: "Cuando tienes muchos puntos, escribir las coordenadas una a una es tedioso. pgfplots puede leer directamente archivos CSV o separados por espacios. Exportar CSV desde converTeXcel y leerlo es un flujo muy práctico.",
          de: "Bei vielen Datenpunkten ist es mühsam, Koordinaten einzeln zu schreiben. pgfplots kann CSV- oder leerzeichengetrennte Datendateien direkt lesen. CSV aus converTeXcel zu exportieren und einzulesen ist ein praktischer Ablauf.",
        },
      },
      {
        type: "heading",
        text: {
          ja: "データファイルを用意する",
          en: "Prepare a data file",
          zh: "准备数据文件",
          "zh-Hant": "準備資料檔案",
          es: "Preparar un archivo de datos",
          de: "Eine Datendatei vorbereiten",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "1行目に列名、2行目以降に数値を並べたテキストファイルを用意します。例えば data.csv を次のようにします。",
          en: "Create a text file with column names on the first line and numbers on the following lines. For example, make data.csv like this.",
          zh: "创建一个文本文件，第一行是列名，后续行是数值。例如把 data.csv 写成这样。",
          "zh-Hant": "建立一個文字檔案，第一行是欄名，後續行是數值。例如把 data.csv 寫成這樣。",
          es: "Crea un archivo de texto con los nombres de columna en la primera línea y los números en las siguientes. Por ejemplo, crea data.csv así.",
          de: "Erstelle eine Textdatei mit Spaltennamen in der ersten Zeile und Zahlen in den folgenden Zeilen. Erstelle zum Beispiel data.csv so.",
        },
      },
      {
        type: "code",
        code: ["x,y", "1,2.3", "2,3.1", "3,4.8", "4,5.9"].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "\\addplot table で読み込む",
          en: "Read it with \\addplot table",
          zh: "用 \\addplot table 读取",
          "zh-Hant": "用 \\addplot table 讀取",
          es: "Leerlo con \\addplot table",
          de: "Mit \\addplot table einlesen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "table オプションで列名を指定して読み込みます。区切りがカンマのときは col sep=comma を付けます。",
          en: "Read the file by naming the columns in the table option. When the separator is a comma, add col sep=comma.",
          zh: "在 table 选项中指定列名来读取。当分隔符是逗号时，加上 col sep=comma。",
          "zh-Hant": "在 table 選項中指定欄名來讀取。當分隔符是逗號時，加上 col sep=comma。",
          es: "Lee el archivo nombrando las columnas en la opción table. Cuando el separador es una coma, añade col sep=comma.",
          de: "Lies die Datei, indem du die Spalten in der table-Option benennst. Ist das Trennzeichen ein Komma, füge col sep=comma hinzu.",
        },
      },
      {
        type: "code",
        code: [
          "\\begin{tikzpicture}",
          "\\begin{axis}",
          "  \\addplot table[x=x, y=y, col sep=comma] {data.csv};",
          "\\end{axis}",
          "\\end{tikzpicture}",
        ].join("\n"),
      },
      {
        type: "heading",
        text: {
          ja: "列を選ぶ・複数系列を描く",
          en: "Choose columns and plot multiple series",
          zh: "选择列、绘制多个系列",
          "zh-Hant": "選擇欄、繪製多個系列",
          es: "Elegir columnas y graficar varias series",
          de: "Spalten wählen und mehrere Reihen zeichnen",
        },
      },
      {
        type: "paragraph",
        text: {
          ja: "同じファイルに複数の y 列があるときは、\\addplot table を列ごとに繰り返せば複数系列を重ねられます。",
          en: "When the same file has several y columns, repeat \\addplot table for each column to overlay multiple series.",
          zh: "当同一文件有多个 y 列时，对每一列重复 \\addplot table，即可叠加多个系列。",
          "zh-Hant": "當同一檔案有多個 y 欄時，對每一欄重複 \\addplot table，即可疊加多個系列。",
          es: "Cuando el mismo archivo tiene varias columnas y, repite \\addplot table para cada columna para superponer varias series.",
          de: "Hat dieselbe Datei mehrere y-Spalten, wiederhole \\addplot table für jede Spalte, um mehrere Reihen zu überlagern.",
        },
      },
      {
        type: "code",
        code: [
          "\\addplot table[x=x, y=y1, col sep=comma] {data.csv};",
          "\\addplot table[x=x, y=y2, col sep=comma] {data.csv};",
        ].join("\n"),
      },
      {
        type: "paragraph",
        text: {
          ja: "converTeXcel で整えた表を CSV として書き出せば、そのまま \\addplot table の入力に使えます。",
          en: "If you export a table tidied up in converTeXcel as CSV, you can feed it straight into \\addplot table.",
          zh: "把在 converTeXcel 中整理好的表格导出为 CSV，就可以直接用作 \\addplot table 的输入。",
          "zh-Hant": "把在 converTeXcel 中整理好的表格匯出為 CSV，就可以直接用作 \\addplot table 的輸入。",
          es: "Si exportas como CSV una tabla ordenada en converTeXcel, puedes usarla directamente como entrada de \\addplot table.",
          de: "Wenn du eine in converTeXcel aufbereitete Tabelle als CSV exportierst, kannst du sie direkt als Eingabe für \\addplot table verwenden.",
        },
      },
      {
        type: "reference",
        href: "https://ctan.org/pkg/pgfplots",
        label: {
          ja: "公式マニュアル（pgfplots, CTAN）",
          en: "Official manual (pgfplots, CTAN)",
          zh: "官方手册（pgfplots, CTAN）",
          "zh-Hant": "官方手冊（pgfplots, CTAN）",
          es: "Manual oficial (pgfplots, CTAN)",
          de: "Offizielles Handbuch (pgfplots, CTAN)",
        },
      },
    ],
  },
]
