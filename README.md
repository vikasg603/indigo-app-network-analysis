# Reverse Engineering the Indigo App

This document explains the process of reverse engineering the Indigo app to discover the encryption method used in generating the auth token and retrieving flight information and fares for any route. This involves decrypting the `SessionRequest` string and the response, both of which are AES-256 encrypted. Below are the steps I took to achieve this.

## Overview

1. **Identifying the Encrypted Request**: 
    - The Indigo app sends an encrypted string (`SessionRequest`) to `https://6edigiapps.goindigo.in/custom/indigo/6esessionV2`.
    - The response to this request is also encrypted.

2. **Decrypting the `SessionRequest` String**:
    - The `SessionRequest` string is a Base64 string of an AES-256 encrypted payload.
    - The response is also AES-256 encrypted.

## Steps to Reverse Engineer

### Analyzing HTTP Requests

1. **Intercepting Traffic**:
    - I used a network traffic analyzer to monitor the HTTPS requests made by the Indigo app.
    - Noticed a peculiar request to `https://6edigiapps.goindigo.in/custom/indigo/6esessionV2` with encrypted input and output.

2. **Initial Hypothesis**:
    - Initially thought the encrypted strings were random, but further analysis suggested otherwise.

### Decompiling the APK

1. **Decompiling the Indigo APK**:
    - Decompiled the Indigo app's APK file to inspect the source code.
    - Searched for `SessionRequest` within the decompiled code.

2. **Challenges**:
    - The app code was obfuscated, making it difficult to understand the exact process.
    
### Using Frida for Dynamic Analysis

1. **Introduction to Frida**:
    - Frida is a dynamic instrumentation toolkit that allows you to hook into the app's runtime and inspect the internal behavior.

2. **Inspecting with Frida**:
    - Hooked into the running app to monitor the encryption process.
    - After several hours of inspection, discovered that the `SessionRequest` string is AES-256 encrypted.

3. **Finding the Key and IV**:
    - Used Frida to extract the AES encryption key and initialization vector (IV) used by the app.

### Dealing with Akamai BMP Protection

1. **Understanding Akamai BMP**:
    - The Indigo app uses Akamai BMP (Bot Manager Premier) for additional protection, specifically with the `x-acf-sensor-data` header.

2. **Bypassing Akamai BMP**:
    - Utilized an existing Akamai BMP generator [available here](https://github.com/xvertile/akamai-bmp-generator).
    - Modified it more to achieve a 60% success rate.

## Tools and Resources Used

- **Frida**:
    - A powerful toolkit for dynamic code instrumentation on Android and iOS apps.
    - [Official Website](https://frida.re/)
    
- **Akamai BMP Generator**:
    - Tool used to bypass Akamai's Bot Manager Premier protection.
    - This is public repository that give some 20-30% success rate, I modified it to give 60% success rate.
    - Have not published the modified version yet.
    - [GitHub Repository](https://github.com/xvertile/akamai-bmp-generator)

## Conclusion

By intercepting and analyzing the network traffic, decompiling the APK, and using Frida for dynamic analysis, I was able to reverse engineer the Indigo app's encryption process. This allowed me to decrypt the `SessionRequest` string and the encrypted response, enabling access to flight information and fares for any route.

## Disclaimer

This document is intended for educational purposes only. Reverse engineering software may violate terms of service or applicable laws. Always ensure you have permission before attempting to reverse engineer or interact with protected software and services.