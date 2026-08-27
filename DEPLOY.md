# Deploy

## Ubuntu/Debian

```bash
chmod +x scripts/*.sh
scripts/install.sh
sudo cp scripts/bar-radio.service /etc/systemd/system/bar-radio.service
sudo systemctl daemon-reload
sudo systemctl enable icecast2
sudo systemctl enable bar-radio
sudo systemctl start icecast2
sudo systemctl start bar-radio
```

## Health

```bash
npm run deploy:health
npm run release:health
```

## Backup

```bash
scripts/backup.sh
npm run deploy:backup
```
