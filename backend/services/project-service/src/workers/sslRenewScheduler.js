import cron from 'node-cron';
import { renewDueCertificates } from '../utils/sslUtils.js';
import { reloadNginx } from '../../../../shared/nginx/reloadNginx.js';
import { docker } from '../utils/docker.js';
import { project_env } from '../lib/env.js';

cron.schedule('0 3 * * *', async () => {
    console.log('[ssl-renew] starting daily certificate renew check');
    try {
        const results = await renewDueCertificates();
        const ok = results.filter((r) => r.ok).length;
        const failed = results.length - ok;
        console.log(`[ssl-renew] done: ${ok} renewed/ok, ${failed} failed, total ${results.length}`);

        if (ok > 0 && project_env.NODE_ENV === 'production') {
            await reloadNginx(docker);
        }
    } catch (error) {
        console.error('[ssl-renew] scheduler error:', error.message);
    }
});
