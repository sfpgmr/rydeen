## three.jsのPathのシリアライズ(2)

エドワード・マイブリッジの「Horse in motion」をInkscapeでトレースし、各馬をセル化したものをthree.jsのshapeに変換し表示しています。

今回はシリアライズ・デシリアライズのコードを最適化してみました。
[http://bl.ocks.org/sfpgmr/cee0c48acb0854e2055c#pathSerializer.js](http://bl.ocks.org/sfpgmr/cee0c48acb0854e2055c#pathSerializer.js)

下記のURLから動くデモが見れます。Windows 10 Tech Preview 9926 のIE11では動作しませんでした。ひょっとするとIE11ではそもそも動作しないのかもしれません。原因は不明ですが。。

[http://bl.ocks.org/sfpgmr/cee0c48acb0854e2055c](http://bl.ocks.org/sfpgmr/cee0c48acb0854e2055c)