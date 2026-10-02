package com.tcc.usagecollector

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Process
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {
    private lateinit var tokenInput: TextInputEditText
    private lateinit var childNameInput: TextInputEditText
    private lateinit var apiUrlInput: TextInputEditText
    private lateinit var permissionButton: Button
    private lateinit var sendButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var preferences: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tokenInput = findViewById(R.id.tokenInput)
        childNameInput = findViewById(R.id.childNameInput)
        apiUrlInput = findViewById(R.id.apiUrlInput)
        permissionButton = findViewById(R.id.permissionButton)
        sendButton = findViewById(R.id.sendButton)
        progressBar = findViewById(R.id.progressBar)
        statusText = findViewById(R.id.statusText)
        preferences = getSharedPreferences("collector", MODE_PRIVATE)

        tokenInput.setText(preferences.getString("token", ""))
        childNameInput.setText(preferences.getString("child_name", ""))
        apiUrlInput.setText(preferences.getString("api_url", "http://10.204.31.171:5000/api"))

        permissionButton.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }
        sendButton.setOnClickListener { sendUsageData() }
        updatePermissionState()
    }

    override fun onResume() {
        super.onResume()
        if (::permissionButton.isInitialized) updatePermissionState()
    }

    private fun updatePermissionState() {
        permissionButton.text = if (hasUsageAccess()) {
            "Acesso ao uso autorizado"
        } else {
            "Permitir acesso ao uso"
        }
    }

    private fun hasUsageAccess(): Boolean {
        val appOps = getSystemService(APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            packageName,
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun sendUsageData() {
        val token = tokenInput.text?.toString()?.trim().orEmpty()
        val childName = childNameInput.text?.toString()?.trim().orEmpty().ifBlank { "Filho App" }
        val apiUrl = apiUrlInput.text?.toString()?.trim()?.trimEnd('/').orEmpty()

        when {
            token.isBlank() -> {
                statusText.text = "Informe o token criado no dashboard do responsável."
                return
            }
            apiUrl.isBlank() -> {
                statusText.text = "Informe o endereço da API."
                return
            }
            !hasUsageAccess() -> {
                statusText.text = "Autorize o acesso ao uso antes de enviar os dados."
                startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                return
            }
        }

        preferences.edit()
            .putString("token", token)
            .putString("child_name", childName)
            .putString("api_url", apiUrl)
            .apply()

        setLoading(true)
        lifecycleScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val records = collectUsageRecords()
                    postUsage(apiUrl, token, childName, records)
                } catch (error: Exception) {
                    Result.failure(error)
                }
            }
            setLoading(false)
            statusText.text = result.fold(
                onSuccess = { "Dados enviados: $it aplicativos." },
                onFailure = { "Falha ao enviar: ${it.message ?: "erro desconhecido"}" },
            )
        }
    }

    private fun collectUsageRecords(): List<UsageRecord> {
        val usageManager = getSystemService(USAGE_STATS_SERVICE) as UsageStatsManager
        val packageManager = packageManager
        val end = System.currentTimeMillis()
        val start = end - 24 * 60 * 60 * 1000L
        val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val stats = usageManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end)

        return stats.asSequence()
            .filter { it.totalTimeInForeground > 0L }
            .mapNotNull { stat ->
                try {
                    val appInfo = packageManager.getApplicationInfo(stat.packageName, 0)
                    val label = packageManager.getApplicationLabel(appInfo).toString()
                    UsageRecord(
                        packageName = stat.packageName,
                        appName = label.ifBlank { stat.packageName },
                        minutes = (stat.totalTimeInForeground / 60_000L).toInt(),
                        date = date,
                    )
                } catch (_: PackageManager.NameNotFoundException) {
                    null
                }
            }
            .filter { it.minutes > 0 }
            .distinctBy { it.packageName }
            .sortedByDescending { it.minutes }
            .toList()
    }

    private fun postUsage(
        apiUrl: String,
        token: String,
        childName: String,
        records: List<UsageRecord>,
    ): Result<Int> {
        if (records.isEmpty()) return Result.success(0)

        val payload = JSONObject().apply {
            put("token", token)
            put("nome_filho", childName)
            put("dispositivo_id", androidId())
            put("dados", JSONArray().apply {
                records.forEach { record ->
                    put(JSONObject().apply {
                        put("package_name", record.packageName)
                        put("nome", record.appName)
                        put("tempo_minutos", record.minutes)
                        put("data_uso", record.date)
                    })
                }
            })
        }

        val connection = (URL("$apiUrl/dashboard/tempo-uso").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 30_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
        }

        return try {
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val status = connection.responseCode
            if (status in 200..299) {
                Result.success(records.size)
            } else {
                val errorBody = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                Result.failure(IllegalStateException("HTTP $status ${errorBody.take(160)}"))
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun androidId(): String = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        ?: "android-$packageName"

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        sendButton.isEnabled = !loading
        permissionButton.isEnabled = !loading
    }

    private data class UsageRecord(
        val packageName: String,
        val appName: String,
        val minutes: Int,
        val date: String,
    )
}
