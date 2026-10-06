import sqlite3, pathlib, json
c=sqlite3.connect(':memory:')
c.execute('PRAGMA foreign_keys=ON')
for p in sorted(pathlib.Path('drizzle').glob('*.sql')):c.executescript(p.read_text())
c.execute('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)',('t','payable','Loja 1','2026-10-05','{}',1,'test','now'))
c.execute('INSERT INTO balances VALUES(?,?)',('t',100000))
def settle(id,amount):
 with c:
  c.execute('UPDATE balances SET remaining=remaining-? WHERE record_id=? AND remaining>=?',(amount,'t',amount))
  c.execute('INSERT INTO settlements(id,record_id,amount,date,account,note,created_by) SELECT ?,?,?,?,?,?,? WHERE changes()=1',(id,'t',amount,'2026-10-05','bank','','test'))
settle('partial',60000)
assert c.execute('SELECT remaining FROM balances').fetchone()[0]==40000
settle('excess',40001)
assert c.execute('SELECT remaining FROM balances').fetchone()[0]==40000
assert c.execute('SELECT COUNT(*) FROM settlements').fetchone()[0]==1
settle('final',40000)
assert c.execute('SELECT remaining FROM balances').fetchone()[0]==0
assert c.execute('SELECT SUM(amount) FROM settlements').fetchone()[0]==100000
print('PASS: migrations, partial settlement, overpayment rejection, final balance and referential integrity')
