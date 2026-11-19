import { useState } from "react";
import "./App.css";

const API = "http://localhost:3001/api";

function App() {
  const [apiToken, setApiToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [buckets, setBuckets] = useState([]);
  const [objects, setObjects] = useState([]);
  const [instances, setInstances] = useState([]);
  const [health, setHealth] = useState({});
  const [modifyTypes, setModifyTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [bucketName, setBucketName] = useState("");
  const [deleteBucketName, setDeleteBucketName] = useState("");
  const [listObjectsBucket, setListObjectsBucket] = useState("");
  const [objectBucket, setObjectBucket] = useState("");
  const [objectKey, setObjectKey] = useState("");
  const [file, setFile] = useState(null);
  const [downloadBucket, setDownloadBucket] = useState("");
  const [downloadKey, setDownloadKey] = useState("");
  const [deleteObjectBucket, setDeleteObjectBucket] = useState("");
  const [deleteObjectKey, setDeleteObjectKey] = useState("");

  async function apiFetch(url, options = {}) {
    if (!apiToken) {
      throw new Error("Connect with the backend API token first");
    }

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${apiToken}`);
    return fetch(url, { ...options, headers });
  }

  async function run(action) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function connectApi(event) {
    event.preventDefault();
    const candidate = tokenInput.trim();
    if (!candidate) {
      setError("Backend API token is required");
      return;
    }

    await run(async () => {
      const response = await fetch(`${API}/health`, {
        headers: { Authorization: `Bearer ${candidate}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to connect to backend");
      setApiToken(candidate);
      setTokenInput("");
      setMessage("Connected to backend");
    });
  }

  function disconnectApi() {
    setApiToken("");
    setTokenInput("");
    setBuckets([]);
    setObjects([]);
    setInstances([]);
    setHealth({});
    setError("");
    setMessage("Disconnected from backend");
  }

  async function checkBackendHealth() {
    await run(async () => {
      const response = await apiFetch(`${API}/health`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to check backend health");
      setMessage(data.message);
    });
  }

  async function checkHealth(instanceId) {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}/health`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to check health");
      setHealth((prev) => ({ ...prev, [instanceId]: data.statuses || [] }));
    });
  }

  async function listBuckets() {
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch buckets");
      setBuckets(data.buckets || []);
    });
  }

  async function createBucket() {
    if (!bucketName) {
      setError("Bucket name is required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create bucket");
      setMessage(data.message);
      setBucketName("");
      await listBuckets();
    });
  }

  async function deleteBucket(name) {
    const target = name || deleteBucketName;
    if (!target) {
      setError("Bucket name is required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets/${encodeURIComponent(target)}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete bucket");
      setMessage(data.message);
      setDeleteBucketName("");
      await listBuckets();
    });
  }

  async function listObjects() {
    if (!listObjectsBucket) {
      setError("Bucket name is required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets/${encodeURIComponent(listObjectsBucket)}/objects`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to list objects");
      setObjects(data.objects || []);
    });
  }

  async function uploadObject() {
    if (!objectBucket || !file) {
      setError("Bucket and file are required");
      return;
    }
    await run(async () => {
      const formData = new FormData();
      formData.append("file", file);
      if (objectKey) formData.append("key", objectKey);
      const response = await apiFetch(`${API}/s3/buckets/${encodeURIComponent(objectBucket)}/objects`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload object");
      setMessage(data.message);
      setObjectKey("");
      setFile(null);
    });
  }

  async function downloadObject(bucket, key) {
    const targetBucket = bucket || downloadBucket;
    const targetKey = key || downloadKey;
    if (!targetBucket || !targetKey) {
      setError("Bucket and key are required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets/${encodeURIComponent(targetBucket)}/objects/${encodeURIComponent(targetKey)}/download`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to get download URL");
      window.open(data.downloadUrl, "_blank");
    });
  }

  async function deleteObject(bucket, key) {
    const targetBucket = bucket || deleteObjectBucket;
    const targetKey = key || deleteObjectKey;
    if (!targetBucket || !targetKey) {
      setError("Bucket and key are required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/s3/buckets/${encodeURIComponent(targetBucket)}/objects/${encodeURIComponent(targetKey)}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete object");
      setMessage(data.message);
    });
  }

  async function listInstances() {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch instances");
      setInstances(data.instances || []);
    });
  }

  async function launchInstance() {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to launch instance");
      setMessage(data.message);
      await listInstances();
    });
  }

  async function startInstance(instanceId) {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}/start`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to start instance");
      setMessage(data.message);
    });
  }

  async function stopInstance(instanceId) {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}/stop`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to stop instance");
      setMessage(data.message);
    });
  }

  async function rebootInstance(instanceId) {
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}/reboot`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reboot instance");
      setMessage(data.message);
    });
  }

  async function modifyType(instanceId) {
    const instanceType = modifyTypes[instanceId];
    if (!instanceType) {
      setError("Instance type is required");
      return;
    }
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceType })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to modify instance type");
      setMessage(data.message);
    });
  }

  async function terminateInstance(instanceId) {
    if (!window.confirm(`Terminate ${instanceId}?`)) return;
    await run(async () => {
      const response = await apiFetch(`${API}/ec2/instances/${encodeURIComponent(instanceId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to terminate instance");
      setMessage(data.message);
      await listInstances();
    });
  }

  return (
    <div className="container">
      <h1>CloudControl</h1>

      {message && <p className="message success">{message}</p>}
      {error && <p className="message error">{error}</p>}

      <section>
        <h2>Backend Access</h2>
        <form className="row" onSubmit={connectApi}>
          <input
            type="password"
            autoComplete="off"
            aria-label="Backend API token"
            placeholder="Backend API token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button type="submit" disabled={loading}>Connect</button>
          <button type="button" onClick={disconnectApi} disabled={!apiToken}>Disconnect</button>
          <span>{apiToken ? "Connected" : "Not connected"}</span>
        </form>
        <p>The token is kept in memory only and cleared when you disconnect or reload.</p>
      </section>

      <section>
        <h2>Health</h2>
        <button onClick={checkBackendHealth} disabled={loading}>
          Check Backend Health
        </button>
      </section>

      <section>
        <h2>S3 Buckets</h2>
        <div className="row">
          <button onClick={listBuckets} disabled={loading}>List Buckets</button>
        </div>
        <div className="row">
          <input placeholder="New bucket name" value={bucketName} onChange={(e) => setBucketName(e.target.value)} />
          <button onClick={createBucket} disabled={loading}>Create</button>
        </div>
        <div className="row">
          <input placeholder="Bucket to delete" value={deleteBucketName} onChange={(e) => setDeleteBucketName(e.target.value)} />
          <button onClick={() => deleteBucket()} disabled={loading}>Delete</button>
        </div>
        <div className="resource-box">
          {buckets.length === 0 ? "No buckets loaded." : buckets.map((bucket) => (
            <div key={bucket.Name} className="resource-item">
              <span>{bucket.Name}</span>
              <button onClick={() => deleteBucket(bucket.Name)} disabled={loading}>Delete</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>S3 Objects</h2>
        <div className="row">
          <input placeholder="Bucket name" value={listObjectsBucket} onChange={(e) => setListObjectsBucket(e.target.value)} />
          <button onClick={listObjects} disabled={loading}>List Objects</button>
        </div>
        <div className="resource-box">
          {objects.length === 0 ? "No objects loaded." : objects.map((object) => (
            <div key={object.Key} className="resource-item">
              <span>{object.Key}</span>
              <button onClick={() => downloadObject(listObjectsBucket, object.Key)} disabled={loading}>Download</button>
              <button onClick={() => deleteObject(listObjectsBucket, object.Key)} disabled={loading}>Delete</button>
            </div>
          ))}
        </div>
        <div className="row">
          <input placeholder="Bucket" value={objectBucket} onChange={(e) => setObjectBucket(e.target.value)} />
          <input placeholder="Key (optional)" value={objectKey} onChange={(e) => setObjectKey(e.target.value)} />
          <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
          <button onClick={uploadObject} disabled={loading}>Upload</button>
        </div>
        <div className="row">
          <input placeholder="Bucket" value={downloadBucket} onChange={(e) => setDownloadBucket(e.target.value)} />
          <input placeholder="Key" value={downloadKey} onChange={(e) => setDownloadKey(e.target.value)} />
          <button onClick={() => downloadObject()} disabled={loading}>Download</button>
        </div>
        <div className="row">
          <input placeholder="Bucket" value={deleteObjectBucket} onChange={(e) => setDeleteObjectBucket(e.target.value)} />
          <input placeholder="Key" value={deleteObjectKey} onChange={(e) => setDeleteObjectKey(e.target.value)} />
          <button onClick={() => deleteObject()} disabled={loading}>Delete</button>
        </div>
      </section>

      <section>
        <h2>EC2 Instances</h2>
        <div className="row">
          <button onClick={listInstances} disabled={loading}>List Instances</button>
          <button onClick={launchInstance} disabled={loading}>Launch Instance (from .env)</button>
        </div>
        <div className="resource-box">
          {instances.length === 0 ? "No instances loaded." : instances.map((instance) => (
            <div key={instance.InstanceId} className="instance-card">
              <div className="instance-header">
                <strong>{instance.InstanceId}</strong>
                <span>{instance.State?.Name} · {instance.InstanceType}</span>
              </div>
              <div className="row">
                <button onClick={() => checkHealth(instance.InstanceId)} disabled={loading}>Check Health</button>
                <button onClick={() => startInstance(instance.InstanceId)} disabled={loading}>Start</button>
                <button onClick={() => stopInstance(instance.InstanceId)} disabled={loading}>Stop</button>
                <button onClick={() => rebootInstance(instance.InstanceId)} disabled={loading}>Reboot</button>
                <button onClick={() => terminateInstance(instance.InstanceId)} disabled={loading}>Terminate</button>
              </div>
              <div className="row">
                <input
                  placeholder={`New instance type (current: ${instance.InstanceType})`}
                  value={modifyTypes[instance.InstanceId] || ""}
                  onChange={(e) => setModifyTypes((prev) => ({ ...prev, [instance.InstanceId]: e.target.value }))}
                />
                <button onClick={() => modifyType(instance.InstanceId)} disabled={loading}>Modify Type</button>
              </div>
              {health[instance.InstanceId] && (
                <>
                  <p className="health-summary">
                    System: {health[instance.InstanceId][0]?.SystemStatus?.Status || "unknown"} · Instance: {health[instance.InstanceId][0]?.InstanceStatus?.Status || "unknown"}
                  </p>
                  <pre className="health-result">{JSON.stringify(health[instance.InstanceId], null, 2)}</pre>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;